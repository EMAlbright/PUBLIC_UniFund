import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface User {
    userId: string,
    username: string,
}

interface PetitionCategory {
    id: string;
    expiresAt: { seconds: number };
    categoryName: string;
    categoryId: string;
    description: string;
    yayVotes: Array<any>;
    nayVotes: Array<any>;
    proposedBy: User;
    proposedAmount?: number;
    proposedName?: string;
    proposedUserResponsible?: User;
}


export const ExecutePetition = async(petitionData: PetitionCategory, groupId: string, eventBudgetId: string) => {
    console.log('data', petitionData, 'group', groupId, 'budget', eventBudgetId);
    // either the name, amount, or user responsible
    const categoryRef = doc(db, "groups", groupId, "UserCategories", petitionData.categoryId);
    const categoryInBudgetRef = doc(db, "groups", groupId, "EventBudgets", eventBudgetId);
    const petitionRef = doc(db, "petitions", petitionData.id);
    // grab specific category
    const categoryDoc = await getDoc(categoryInBudgetRef);
    const categoryData = categoryDoc.data();

    const categories = categoryData.categories || [];
    const categoryIndex = categories.findIndex((category: any) => category.newCategoryId === petitionData.categoryId);
    
    if(petitionData.nayVotes.length >= petitionData.yayVotes.length){
        await updateDoc(petitionRef, {
            isComplete: true,
        })
        return "Fail";
    }
    if(petitionData.proposedName){
        // update element of categories array where category id is equal
        categories[categoryIndex].categoryName = petitionData.proposedName;

        await updateDoc(categoryInBudgetRef, {
            categories: categories
        })

        await updateDoc(categoryRef, {
            categoryName: petitionData.proposedName
        })
    }
    if(petitionData.proposedAmount){
        try{
        // have to manually change the new planned amount
        // first grab the current amount allocated
        const currentAmount = categories[categoryIndex].allocatedAmount;
        const currentRemaining = categoryData.remainingAmount;
        let difference = currentAmount - petitionData.proposedAmount;    
        const newRemainingAmount = currentRemaining + difference;

        categories[categoryIndex].allocatedAmount = petitionData.proposedAmount;
        // update element of categories array where category id is equal
        await updateDoc(categoryInBudgetRef, {
            categories: categories,
            remainingAmount: newRemainingAmount
        })

        await updateDoc(categoryRef, {
            allocatedAmount: petitionData.proposedAmount
        })
        }
        catch(error){
            console.log(error)
        }
    }
    if(petitionData.proposedUserResponsible){
        // update element of categories array where category id is equal
        categories[categoryIndex].userIdResponsible = petitionData.proposedUserResponsible.userId;
        categories[categoryIndex].usernameResponsible = petitionData.proposedUserResponsible.username;
        await updateDoc(categoryInBudgetRef, {
            categories: categories
        })

        await updateDoc(categoryRef, {
            userIdResponsible: petitionData.proposedUserResponsible.userId,
            usernameResponsible: petitionData.proposedUserResponsible.username
        })
    }
    await updateDoc(petitionRef, {
        passed: true,
        isComplete: true,
    })
    return "Success";
}