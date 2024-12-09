/**
 * @param groupId
 * @param userId
 * @returns Expenses you have logged ($ spent for that group)
 * total as well as by category
 */

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";

type Expense = {
    categoryId: string;
    categoryName: string;
    amount: number;
    groupId: string;
    createdAt: string;
    id: string;
}

const getStartDate = (timeframe: 'Week' | '2 Weeks' | 'Month' | 'Quarter'): string => {
    const now = new Date();
    const newDate = new Date(now);
    switch (timeframe) {
        case 'Week':
            newDate.setDate(now.getDate() - 7);
            break;
        case '2 Weeks':
            newDate.setDate(now.getDate() - 14);
            break;
        case 'Month':
            newDate.setMonth(now.getMonth() - 1);
            break;
        case 'Quarter':
            newDate.setDate(now.getDate() - 90);
            break;
    }
    return newDate.toISOString();
  };

export const FetchExpensesByGroup = async(userId: string, groupId: string, timeframe: 'Week' | '2 Weeks' | 'Month' | 'Quarter') => {
    // query for user id matching the createdByUserId in payments
    // add category id and total amount
    const userStartDate = getStartDate(timeframe);

    const paymentsRef = collection(db, "payments");
    // query for timeframe
    const q = query(paymentsRef, 
    where("createdByUserId", "==", userId),
    where("createdAt", ">=", userStartDate),
    where("groupId", "==", groupId)
    );

    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map((doc) => ({
        categoryId: doc.data().categoryId,
        amount: Number(doc.data().totalAmount) || 0,
        groupId: doc.data().groupId,
        createdAt: doc.data().createdAt,
        id: doc.id
    })) as Expense[]; 

    const expenseNames = await Promise.all(
        expenses.map(async (expense) => {
            const categoryRef = doc(db, "groups", groupId, "UserCategories", expense.categoryId);
            const categoryDoc = await getDoc(categoryRef);
                return {
                    ...expense,
                    categoryName: categoryDoc.data().categoryName
                };
            }
    ));

    const expensesByCategory = expenseNames.reduce((accumulatedExpense, expense) => {
        const { categoryName, amount } = expense;
        accumulatedExpense[categoryName] = (accumulatedExpense[categoryName] || 0) + amount;
        return accumulatedExpense;
    },{} as Record<string, number>);
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {expensesByCategory, totalAmount};
}