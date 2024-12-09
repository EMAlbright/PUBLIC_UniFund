/**
 * when we delete a budget we need to delete
 * 
 * take in group id and event budget id
 * 
 * EVENT BUDGET ID
 * THE USER CATEGORIES OF THE EVENT BUDGET ID
 * ALL EXPENSES OF THE EVENT BUDGET ID
 * ALL PAYMENTS OF THAT EXPENSE ID ^
 * AND ALL TRANSACTIONS FROM THE USER ARRAY OF THAT PAYMENT ID^
 * 
 */

import { arrayRemove, collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

export const DeleteEventBudget = async(groupId: string, eventbudgetId: string) => {
    try {
        const batch = writeBatch(db);
        const eventBudgetRef = doc(db, "groups", groupId, "EventBudgets", eventbudgetId);

        //delete categories if they exist
        const categoryQuery = query(
            collection(db, "groups", groupId, "UserCategories"),
            where("eventBudgetId", "==", eventbudgetId)
        );
        const categoryDocs = await getDocs(categoryQuery);
        categoryDocs.forEach((categoryDoc) => {
            batch.delete(doc(db, "groups", groupId, "UserCategories", categoryDoc.id));
        });

        //delete expenses if they exist
        const expenseQuery = query(
            collection(db, "expenses"),
            where("eventBudgetId", "==", eventbudgetId)
        );
        const expenseDocs = await getDocs(expenseQuery);
        const expenseIds = expenseDocs.docs.map(doc => doc.id);

        expenseDocs.forEach((expenseDoc) => {
            batch.delete(doc(db, "expenses", expenseDoc.id));
        });

        //only query for payments if there are expenses
        let paymentIds: string[] = [];
        if (expenseIds.length > 0) {
            const paymentQuery = query(
                collection(db, "payments"),
                where("expenseId", "in", expenseIds)
            );
            const paymentDocs = await getDocs(paymentQuery);
            paymentIds = paymentDocs.docs.map(doc => doc.id);
            paymentDocs.forEach((paymentDoc) => {
                batch.delete(doc(db, "payments", paymentDoc.id));
            });
        }

        // Only update user transactions if there are payments to remove
        if (paymentIds.length > 0) {
            const userTransactionQuery = query(collection(db, "users"));
            const userDocs = await getDocs(userTransactionQuery);

            userDocs.forEach((userDoc) => {
                const userData = userDoc.data();
                if (userData.transactions && Array.isArray(userData.transactions)) {
                    // Check if user has any of the payment IDs in their transactions
                    const hasMatchingPayment = userData.transactions.some(
                        transaction => paymentIds.includes(transaction.paymentId)
                    );
                    
                    if (hasMatchingPayment) {
                        paymentIds.forEach((paymentId) => {
                            batch.update(userDoc.ref, {
                                transactions: arrayRemove({
                                    paymentId: paymentId,
                                    isDebt: false
                                })
                            });
                            
                            batch.update(userDoc.ref, {
                                transactions: arrayRemove({
                                    paymentId: paymentId,
                                    isDebt: true
                                })
                            });
                        });
                    }
                }
            });
        }

        // Delete the event budget itself
        batch.delete(eventBudgetRef);
        await batch.commit();
        return "Event Budget Deleted!";
    } catch (error) {
        console.log("Error deleting event budget:", error);
        return "Failed to delete event budget";
    }
}