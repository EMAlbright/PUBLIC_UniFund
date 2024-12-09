

import { arrayUnion, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Alert } from "react-native";

/**
 * Cloud function for updating categories in an event budget
 * Categories array structure example:
 * [
 *   {
 *     categoryName: "Drinks",
 *     allocatedAmount: 50,
 *     responsibleUser: "UserB_ID"
 *   }
 * ]
 * spentAmount is added when expenses are logged
*/

  /**
   * get the current event budget document so that we update
   * the REMAINING AMOUNT
   *  and NUMBER OF CATEGORIES
   * 
   *  We then have to get the users ref and add the category
   *  to their collection, we will have to do the same when we 
   *  add expenses as well
   *  
   *  we have to add to the users collection because say when a user 
   *  logs an expense (what the category actually costed), we want to be 
   *  able to just look at the categories that they are responsible for
   *  and they can add expenses based off those
   * 
   *  and actually we dont have to store the event budget id because we know
   *  that every event budget id is associated with every group member
   *  however they technically could not be assigned a responsibility
   *  but they should still see how much others users in their group spent
   *  on X category
   * 
   * also should porbably wwrite a function wehre takes in user id and returns username
   */
  

interface RecurringCategory {
  categoryName: string;
  categoryId: string;
  allocatedAmount: number;
  userIdResponsible: string;
  usernameResponsible: string;
  recurringBudgetId: string;
  spentAmount?: number;
  frequency?: string;
  groupId: string;
}

export const CreateRecurringCategory = async(RecurringCategoryData: RecurringCategory): Promise<void> => {
    
const recurringBudgetRef = doc(db, "groups", RecurringCategoryData.groupId, "RecurringBudgets", RecurringCategoryData.recurringBudgetId);
  // CHANGE
  // ALSO ADD CATEGORIES AS A COLLECTION INSIDE OF GROUP 
  // THIS MORE EFFICIENT FOR DOING OPERATIONS DOWN THE ROAD
  const userCategoryRef = doc(collection(db, "groups", RecurringCategoryData.groupId, "UserCategories"));
  const newCategoryId = userCategoryRef.id;
  const RecurringDoc = await getDoc(recurringBudgetRef);
  const RecurringBudgetData = RecurringDoc.data();
  const frequency = RecurringBudgetData.frequency;
  let remainingAmount = RecurringBudgetData.remainingAmount;

  let numberOfCategories = RecurringBudgetData.numberOfCategories;
  numberOfCategories += 1;

  const newCategory: RecurringCategory = {
    categoryName: RecurringCategoryData.categoryName,
    categoryId: newCategoryId,
    allocatedAmount: RecurringCategoryData.allocatedAmount,
    userIdResponsible: RecurringCategoryData.userIdResponsible,
    usernameResponsible: RecurringCategoryData.usernameResponsible,
    recurringBudgetId: RecurringCategoryData.recurringBudgetId,
    groupId: RecurringCategoryData.groupId,
    frequency: frequency,
    spentAmount: 0
  };
  // this sets a new category inside of USER CATEGORIES, a colleciton at the same level of EVENT BUDGET
  // duplicate info but for now it will work
  await setDoc(userCategoryRef, newCategory);

  // this edits categories that is WITHIN EVENT BUDGET
  await updateDoc(recurringBudgetRef, {
    categories: arrayUnion(newCategory),
    numberOfCategories: numberOfCategories,
    remainingAmount: remainingAmount - RecurringCategoryData.allocatedAmount
  })
}
