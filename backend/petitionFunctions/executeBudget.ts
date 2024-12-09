import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface User {
    userId: string,
    username: string,
}

interface PetitionBudget {
    id: string;
    eventBudgetId: string;
    expiresAt: { seconds: number };
    description: string;
    yayVotes: Array<any>;
    nayVotes: Array<any>;
    proposedBy: User;
    proposedAmount?: number;
    proposedName?: string;
}


export const ExecuteBudgetPetition = async(petitionData: PetitionBudget, groupId: string) => {
    // either the name, amount, or user responsible
    const petitionRef = doc(db, "petitions", petitionData.id);
    const eventBudgetRef = doc(db, "groups", groupId, "EventBudgets", petitionData.eventBudgetId);
    const currentBudgetDoc = await getDoc(eventBudgetRef);
    const currentBudgetData = currentBudgetDoc.data();
    
    if(petitionData.nayVotes.length >= petitionData.yayVotes.length){
        await updateDoc(petitionRef, {
            isComplete: true,
        })
        return "Fail";
    }
    if(petitionData.proposedName){
        // update element of categories array where category id is equal


        await updateDoc(eventBudgetRef, {
            eventBudgetName: petitionData.proposedName
        })

    }
    if(petitionData.proposedAmount){
        try{
        // have to manually change the new remaining
        // get sume of the allocated amounts in each category
        // subtract that from new planned which is the remaining
        let currentAllocatedAmount = 0;
        currentBudgetData.categories.forEach((category: any) => {
            currentAllocatedAmount += category.allocatedAmount;
        })

        const newRemainingAmount = petitionData.proposedAmount - currentAllocatedAmount;

        // update element of categories array where category id is equal
        await updateDoc(eventBudgetRef, {
            plannedAmount: petitionData.proposedAmount,
            remainingAmount: newRemainingAmount
        })

        }
        catch(error){
            console.log(error)
        }
    }

    await updateDoc(petitionRef, {
        passed: true,
        isComplete: true,
    })
    return "Success";
}