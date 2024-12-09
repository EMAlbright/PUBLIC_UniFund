import { db } from "../../../firebaseConfig";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";


interface RecurringBudget {
    name: string,
    description: string,
    frequency: string
    plannedAmount: number,
    remainingAmount: number,
    spentAmount: number,
    numberOfCategories: 0,
    enableCategories: boolean,
    categories: [],
}
export const CreateRecurring = async(RecurringBudgetData: RecurringBudget, groupId: string) => {

    const recurringBudgetRef = doc(collection(db, "groups", groupId, "RecurringBudgets"));
    const spentAmount = 0;
    const RecurringBudgetDocData: RecurringBudget = {
        name: RecurringBudgetData.name,
        description: RecurringBudgetData.description,

        frequency: RecurringBudgetData.frequency,

        plannedAmount: RecurringBudgetData.plannedAmount,
        remainingAmount: RecurringBudgetData.plannedAmount,
        spentAmount: spentAmount,

        numberOfCategories: RecurringBudgetData.numberOfCategories,
        enableCategories: RecurringBudgetData.enableCategories,
        categories: [],
    }
    try{
        await setDoc(recurringBudgetRef, RecurringBudgetDocData);
    }
    catch(error){
        console.log(error);
    }

}