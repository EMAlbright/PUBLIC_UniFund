import { Alert } from "react-native";
import { db } from "../../../firebaseConfig";
import { useGroup } from "../../globalState/groupContext";
import { addDoc, collection, setDoc, doc } from "firebase/firestore";
/**
 * This function creates a collection EventBudgets inside of the user group
 * This initial creation of the group will only ask the user for the name
 * of the group, description, plannedAmount, deadline
 * These params should be displayed in the CARDS UI WHICH WILL BE DISPLAYED ON THE
 * BUDGETS PAGE OF THE SPECIFIC GROUP
 * 
 * @param EventName 
 * @param EventDescription 
 * @param plannedAmount 
 * @param deadline 
 */

interface EventBudget {
    eventBudgetName: string,
    eventDescription: string,
    plannedAmount: number,
    remainingAmount: number,
    spentAmount: number,
    date: any,
    numberOfCategories: number,
    categories: EventCategory[]
}

interface EventCategory {
    categoryName: string;
    allocatedAmount: number;
    userResponsible: string;
    spentAmount?: number;
  }


export const CreateEventBudget = async(EventName: string, EventDescription: string, plannedAmount: number, date: any, groupId: string, numberOfCategories: number) => {

    const eventBudgetRef = doc(collection(db, "groups", groupId, "EventBudgets"));
    const spentAmount = 0;
    const eventBudgetData: EventBudget = {
        eventBudgetName: EventName,
        eventDescription: EventDescription,
        plannedAmount: plannedAmount,
        remainingAmount: plannedAmount,
        spentAmount: spentAmount,
        date: date,
        numberOfCategories: numberOfCategories,
        categories: []
    }
    try{
        await setDoc(eventBudgetRef, eventBudgetData);
    }
    catch(error){
        console.log(error);
    }

}