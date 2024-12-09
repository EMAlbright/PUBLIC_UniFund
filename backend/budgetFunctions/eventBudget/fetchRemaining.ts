
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

/**
 * @param EventId
 * @returns remaining amount of the event budget
 * 
 */


export const GetRemainingEventAmount = async(groupId: string, eventBudgetId: string): Promise<number> => {
    const budgetRef = doc(db, "groups", groupId, "EventBudgets", eventBudgetId);
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