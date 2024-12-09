
/** 
 * can change name or amount
 * 
 * name no matter what
 * amount as long as amount < whats already been spent
 * 
 */

import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { Alert } from "react-native";
import { db } from "../../firebaseConfig";

interface User {
    userId: string,
    username: string
}

interface EventBudgetPetition {
    eventBudgetId: string;
    type: string;
    groupId: string;
    expiresAt: Date;
    proposedAt: Date;
    description: string;
    passed: boolean;
    proposedBy: User;
    proposedName?: string;
    proposedAmount?: number;
    isComplete: boolean;
    yayVotes: User[];
    nayVotes: User[];
}

export const CreateEventPetition = async(petitionData: EventBudgetPetition) => {
    const expenseRef = collection(db, "expenses");

    if(petitionData.proposedAmount){
        const q = query(
            expenseRef,
            where("eventBudgetId", "==", petitionData.eventBudgetId)
        );
        const querySnap = await getDocs(q);
        
        let totalSpent = 0;
        if (!querySnap.empty) { 
            querySnap.docs.forEach((docData) => {
                const data = docData.data();
                totalSpent += data.spentAmount || 0;
            });
        }

        if(petitionData.proposedAmount < totalSpent){
            Alert.alert(`Members have already spent $${totalSpent} in this budget. The new budget amount must be higher than this.`);
            return;
        }
    }

    try{
        const petitionsRef = collection(db, "petitions");
        const petitionsDoc = doc(petitionsRef);
        const newPetitionData: EventBudgetPetition = {
            eventBudgetId: petitionData.eventBudgetId,
            type: petitionData.type,
            groupId: petitionData.groupId,
            expiresAt: petitionData.expiresAt,
            proposedAt: new Date(),
            description: petitionData.description,
            passed: false, 
            isComplete: false,
            proposedBy: petitionData.proposedBy,
            yayVotes: petitionData.yayVotes, 
            nayVotes: petitionData.nayVotes, 
        }
        if (petitionData.proposedName) {
            newPetitionData.proposedName = petitionData.proposedName;
        }
        if (petitionData.proposedAmount) {
            newPetitionData.proposedAmount = petitionData.proposedAmount;
        }

        await setDoc(petitionsDoc, newPetitionData);
        Alert.alert("Petition Created Successfully!");
    }
    catch(error){
        console.log("Error creating petition ", error);
    }
}