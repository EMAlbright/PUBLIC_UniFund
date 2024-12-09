import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

/**
 * @param RecurringBudgetId
 * @returns remaining amount of the recurring budget
 * 
 */


export const GetRemainingRecurringAmount = async(groupId: string, recurringBudgetId: string): Promise<number> => {
    const budgetRef = doc(db, "groups", groupId, "RecurringBudgets", recurringBudgetId);
    const budgetDoc = await getDoc(budgetRef);
    if(!budgetRef || !budgetDoc){
        console.log("no budget doc or ref");
    }
    try{
        const remainingAmount = budgetDoc.data().remainingAmount;
        // member names now the array of member user IDs
        // query through users to get usernames
        return remainingAmount;
    }
    catch(error){
        console.log(error);
    }
}