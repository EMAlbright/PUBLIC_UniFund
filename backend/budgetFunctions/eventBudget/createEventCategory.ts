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
  

interface EventCategory {
  categoryName: string;
  newCategoryId: string;
  allocatedAmount: number;
  userIdResponsible: string;
  usernameResponsible: string;
  eventBudgetId: string;
  spentAmount?: number;
}

export const CreateEventCategory = async(groupId: string, eventBudgetId: string, categoryName: string, allocatedAmount: number, userIdResponsible: string, usernameResponsible: string): Promise<void> => {
  // event budget reference
  const eventBudgetRef = doc(db, "groups", groupId, "EventBudgets", eventBudgetId);
  // CHANGE
  // ALSO ADD CATEGORIES AS A COLLECTION INSIDE OF GROUP 
  // THIS MORE EFFICIENT FOR DOING OPERATIONS DOWN THE ROAD
  const userCategoryRef = doc(collection(db, "groups", groupId, "UserCategories"));

  const newCategoryId = userCategoryRef.id;

  const eventDoc = await getDoc(eventBudgetRef);
  const eventBudgetData = eventDoc.data();
  let remainingAmount = eventBudgetData.remainingAmount;
  let numberOfCategories = eventBudgetData.numberOfCategories;
  numberOfCategories += 1;

  const newCategory: EventCategory = {
    categoryName,
    newCategoryId,
    allocatedAmount,
    userIdResponsible,
    usernameResponsible,
    eventBudgetId,
    spentAmount: 0
  };
  // this sets a new category inside of USER CATEGORIES, a colleciton at the same level of EVENT BUDGET
  // duplicate info but for now it will work
  await setDoc(userCategoryRef, newCategory);

  // this edits categories that is WITHIN EVENT BUDGET
  await updateDoc(eventBudgetRef, {
    categories: arrayUnion(newCategory),
    numberOfCategories: numberOfCategories,
    remainingAmount: remainingAmount - allocatedAmount
  })
}
