/**
    create 2 maps
    loop through the passed in userIds TRANSACTIONS array

    when isDebt is true, loop through the payment Id, and find where userId === userId (in owedDetails) and status is confirmed
    grab the loggerName, the categoryName and groupName of that paymentId, and 
    you paid {loggerName} back {owedDetails.spentAmount} for {categoryName} in {groupName}

    when isDebt is false, still loop through paymentId, find all instances where status is confirmed
    grab the owedDetails.username, owedDetails.amount, the categoryName and groupName of that paymentId, and
    {username} paid you back {owedDetails.spentAmount} for {categoryName} in {groupName}

    just write 2 functions that take in a paymentId and return the categoryName and another for groupName

    confirmedCredits = {}
    confirmedDebits = {}
 */
    
interface OwedDetail {
    userId: string;
    username: string;
    amountOwed: number;
    status: string;
    confirmedByDebtor: boolean;
    confirmedByLogger: boolean;
}
    
interface Payment {
    createdByUsername: string;
    totalAmount: number;
    owedDetails: OwedDetail[];
}

import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { FetchCategoryAndGroupNameFromPaymentId } from "./fetchPaymentNames";

export const GetConfirmedTransactions = async(userId: string) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    // hold the transactions in an array
    const transactions = userDoc.data()?.transactions || [];
    
    // Initialize maps to hold confirmed transactions
    const confirmedTransactions = {
        credits: [] as any[],
        debits: [] as any[]
    };
    
    // loop through transactions to grab all paymentIds
    // add isDebt: true paymentIds to confirmedDebts
    // add isDebt: false paymentIds to confirmedCredits
    // for.. of waits async, foreach doesnt
    for(const transaction of transactions){
        const paymentRef = doc(db, "payments", transaction.paymentId);
        const paymentDoc = await getDoc(paymentRef);
        const paymentData = paymentDoc.data() as Payment;

        const { groupname, categoryname } = await FetchCategoryAndGroupNameFromPaymentId(transaction.paymentId);
        // if its a debt that you paid back
        if(transaction.isDebt){
            // find in owedDetails where your id is the debtor and its confirmed
            const confirmedDebt = paymentData.owedDetails.filter(
                detail => detail.userId === userId &&
                detail.status === "confirmed" &&
                detail.confirmedByDebtor && 
                detail.confirmedByLogger
            );
            // for a confirmed debt push the data to array
            confirmedDebt.forEach(debt => {
                confirmedTransactions.debits.push({
                    paymentId: transaction.paymentId,
                    expenseLogger: paymentData.createdByUsername,
                    paidAmount: debt.amountOwed,
                    groupName: groupname,
                    categoryName: categoryname
                });
            });
        }
        // else its a creidt
        else{
            const confirmedCredit = paymentData.owedDetails.filter(
                detail => detail.status === "confirmed" &&
                detail.confirmedByDebtor &&
                detail.confirmedByLogger
            );
            confirmedCredit.forEach(credit => {
                confirmedTransactions.credits.push({
                    paymentId: transaction.paymentId,
                    debtLogger: credit.username,
                    paidAmount: credit.amountOwed,
                    groupName: groupname,
                    categoryName: categoryname
                });
            });
        }
    }
    return confirmedTransactions;
}