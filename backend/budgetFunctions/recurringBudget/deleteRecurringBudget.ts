/**
 * when we delete a budget we need to delete
 * 
 * RECURRING BUDGET ID
 * THE USER CATEGORIES OF THE RECURRING BUDGET ID
 * ALL EXPENSES OF THE RECURRING BUDGET ID
 * ALL PAYMENTS OF THAT EXPENSE ID ^
 * AND ALL TRANSACTIONS FROM THE USER ARRAY OF THAT PAYMENT ID^
 * 
 */

import { arrayRemove, collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

export const DeleteRecurringBudget = async(groupId: string, recurringbudgetId: string) => {
    try{
    const batch = writeBatch(db);
    const recurringBudgetRef = doc(db, "groups", groupId, "RecurringBudgets", recurringbudgetId);
    //delete categories
    const categoryQuery = query(
        collection(db, "groups", groupId, "UserCategories"),
        where("recurringBudgetId", "==", recurringbudgetId)
    )
    const categoryDocs = await getDocs(categoryQuery);
    categoryDocs.forEach((categoryDoc) => {
        batch.delete(doc(db, "groups", groupId, "UserCategories", categoryDoc.id));
    });

    // first delete expenses
    const expenseQuery = query(
        collection(db, "expenses"),
        where("recurringBudgetId", "==", recurringbudgetId)
    );
    const expenseDocs = await getDocs(expenseQuery);
    const expenseIds = expenseDocs.docs.map(doc => doc.id);

    expenseDocs.forEach((expenseDoc) => {
        batch.delete(doc(db, "expenses", expenseDoc.id));
    });

    // delete the payments, if its exppense id is in the expense Ids
    let paymentIds: string[] = [];
    if(expenseIds.length > 0){
        const paymentQuery = query(
            collection(db, "payments"),
            where("expenseId", "in", expenseIds)
        );
        const paymentDocs = await getDocs(paymentQuery);
        paymentIds = paymentDocs.docs.map(doc => doc.id);
        paymentDocs.forEach((paymentDoc) => {
            batch.delete(doc(db, "payments", paymentDoc.id))
        });
    }

    // if the payment id is in the users transactions array delete that as well
    if(paymentIds.length > 0){
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

    // lastly delete event budget
    batch.delete(recurringBudgetRef);
    await batch.commit();
    return "Recurring Budget Deleted!"
    }
    catch(error){
        console.log("Error deleting event budget:", error);
        return "Failed to delete event budget";
    }
}