import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { _Image } from "react-native";
import { FetchUsername } from "../../fetchUsername";

/**
 * this file will add an expense from the selected users cateogry
 * 
 * this should update the EVENT BUDGET spent amount as well as
 * the SELECTED CATEGORIES spent amount in both the CATEGORIES ARRAY 
 * of the EVENT BUDGET and the USER CATEGORIES collection inside the GROUP
 * 
 * this should also create a new NOTIFICATION inside of every user that
 * is in the GROUP that {username} spent {amount} on {selectedCategory}
 * 
 * this should also add a new EXPENSE inside of the EXPENSE collection
 * where each expense has:
 * 
 * categoryId
 * groupId
 * eventBudgetId
 * spentAmount
 * splitType: **equal or custom** - Say UserD logs an expense of $100 and creates custom splitf
 * splitDetails: [
 *  { "userId": "userA", "amountOwed": 40.00 },
    { "userId": "userB", "amountOwed": 30.00 },
    { "userId": "userC", "amountOwed": 30.00 }
 * ]

   actually, no split type, its just split details which on frontend will initially be split

 * we dont need PaidBy because only the user who is responsible for can add an expense
 * we also need to store the expenseId inside of the PAYMENTS collection
 * PAYMENTS will track which USER spent WHAT
 * if SPLITS is CUSTOM then it will be an array of AMOUNT which should sum to spentAmount
 * if you are updating the same category this should updateDoc
 */
type Split = {userId: string, amountOwed: number}

interface ExpenseData {
   expenseCreaterUserId: string,
   expenseCreaterUsername: string,
   categoryId: string,
   groupId: string,
   eventBudgetId?: string,
   recurringBudgetId?: string,
   spentAmount: number,
   splitDetails: Array<Split>
}

const roundToTwoDecimals = (num: number): number => {
   return Math.round(num * 100) / 100;
};


export const CreateExpense = async(expenseData: ExpenseData) => {
   const sanitizedExpenseData = {
      ...expenseData,
      spentAmount: roundToTwoDecimals(expenseData.spentAmount),
      splitDetails: expenseData.splitDetails
      .filter(split => split.userId !== expenseData.expenseCreaterUserId) 
      .map(split => ({
          ...split,
          amountOwed: roundToTwoDecimals(split.amountOwed)
      }))
  };
   //reference
   const expenseRef = doc(collection(db, "expenses"));
   const expenseId = expenseRef.id;
   // set the new expense in the expenses collection
   await setDoc(expenseRef, sanitizedExpenseData);

   // update the spent amount of 
   const UserCategoriesSnapshot = await getDocs(collection(db, "groups", sanitizedExpenseData.groupId, "UserCategories"));
   let targetCategoryDocId = null;
   UserCategoriesSnapshot.forEach((doc) => {
      if(doc.id === sanitizedExpenseData.categoryId) {
         targetCategoryDocId = doc.id;
      }
   });
   // get reference to the matching UserCategory doc
   const UserCategoryRef = doc(db, "groups", sanitizedExpenseData.groupId, "UserCategories", targetCategoryDocId);
   // get the current spent amount of that category
   const UserCategoryData = await getDoc(UserCategoryRef);
   const currentCategoryAmount = UserCategoryData.data().spentAmount;
   // add the expense amount to the current amount spent
   await updateDoc(UserCategoryRef, {
      spentAmount: currentCategoryAmount + sanitizedExpenseData.spentAmount 
   })
   
   // do same thing for the event budget
   if(expenseData.eventBudgetId){
      const EventBudgetSnapshot = await getDocs(collection(db, "groups", sanitizedExpenseData.groupId, "EventBudgets"));
      let targetEventDocId = null;
      EventBudgetSnapshot.forEach((doc) => {
         if(doc.id === sanitizedExpenseData.eventBudgetId){
            targetEventDocId = doc.id;
         }
      });
      const EventBudgetRef = doc(db, "groups", sanitizedExpenseData.groupId, "EventBudgets", targetEventDocId);
      const EventBudgetData = await getDoc(EventBudgetRef);
      const currentEventAmount = EventBudgetData.data().spentAmount;
      await updateDoc(EventBudgetRef, {
         spentAmount: currentEventAmount + sanitizedExpenseData.spentAmount
      });
   }

   if(expenseData.recurringBudgetId){
      const RecurringBudgetSnapshot = await getDocs(collection(db, "groups", sanitizedExpenseData.groupId, "RecurringBudgets"));
      let targetRecurringDocId = null;
      RecurringBudgetSnapshot.forEach((doc) => {
         if(doc.id === sanitizedExpenseData.recurringBudgetId){
            targetRecurringDocId = doc.id;
         }
      });
      const RecurringBudgetRef = doc(db, "groups", sanitizedExpenseData.groupId, "RecurringBudgets", targetRecurringDocId);
      const RecurringBudgetData = await getDoc(RecurringBudgetRef);
      const currentEventAmount = RecurringBudgetData.data().spentAmount;
      await updateDoc(RecurringBudgetRef, {
         spentAmount: currentEventAmount + sanitizedExpenseData.spentAmount
      });
   }

   const notifierName = sanitizedExpenseData.expenseCreaterUsername;

   // add to payments the transaction as well
   // need to grab the expense id
   // also should set a pppayments array in the user collection and add
   // the paymentId
   // the payments collection should have
   // the erson who logged the expense, how much it was for
   // how much the other member(s) owe
   // should have 2 tabs, one for anything you owe and one for anything owed to you
   // both tabs will have a paid button, and until all parties have said it has
   // been paid, the transaction is still pending 
   const owedDetails = await Promise.all(
      sanitizedExpenseData.splitDetails.map(async member => {
         const username = await FetchUsername(member.userId);
         if(member.amountOwed > 0){
            return {
               userId: member.userId,
               username: username,
               amountOwed: member.amountOwed,
               confirmedByDebtor: false,
               confirmedByLogger: false,
               status: "pending"
            };
         }
      })
   );

   const paymentRef = doc(collection(db, "payments"));
   await setDoc(paymentRef, {
      groupId: sanitizedExpenseData.groupId,
      categoryId: sanitizedExpenseData.categoryId,
      expenseId: expenseId,
      createdAt: new Date().toISOString(),
      createdByUserId: sanitizedExpenseData.expenseCreaterUserId,
      createdByUsername: sanitizedExpenseData.expenseCreaterUsername,
      totalAmount: sanitizedExpenseData.spentAmount,
      owedDetails: owedDetails
   });
   const paymentId = paymentRef.id;

      // send a notification to all members who were charged
      sanitizedExpenseData.splitDetails.forEach(async (member) => {
         const userRef = doc(db, "users", member.userId);
            const UserExpenseNotificationRef = collection(db, "users", member.userId, "notifications");
            addDoc(UserExpenseNotificationRef, {
                notificationType: "expenseCreation",
                content: `${notifierName} added an expense associated with you.`,
                groupId: sanitizedExpenseData.groupId,
                createdAt: new Date().toISOString(),
                read: false
            });
         await updateDoc(userRef,  {
            transactions: arrayUnion({paymentId, isDebt: true})
         });
      });  
      
      const expenseCreatorRef = doc(db, "users", expenseData.expenseCreaterUserId);
      await updateDoc(expenseCreatorRef,  {
         transactions: arrayUnion({paymentId, isDebt: false})
      });
}