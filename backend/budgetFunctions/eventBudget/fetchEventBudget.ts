/**
 * takes in an event budget id and returns the doc data
 */

import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

export const GetBudgetData = async(eventBudgetId: string, groupId: string) => {
    const evenBudgetRef = doc(db, "groups", groupId, "EventBudgets", eventBudgetId);
    const eventBudget = await getDoc(evenBudgetRef);
    return eventBudget.data();
}