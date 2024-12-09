import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Alert } from "react-native";

/**
 * reasons creating a petition could fail: 
 * 
 * NAME: (no reason)
 * AMOUNT: 
 * 1.) If the proposed amount is LESS than the already spent amount
 * 2.) If the proposed amount is HIGHER than the budgets amount left to allocated (must increase budget amount first)
 * USER RESPONSIBLE:
 * 1.) If the user responsible has outstanding transactions (all transaction in the category must be CONFIRMED)
 * 
 */

interface User {
    userId: string;
    username: string;
}

interface PetitionData {
    categoryId: string;
    categoryName: string;
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
    proposedUserResponsible?: User;
    isComplete: boolean;
    yayVotes: User[];
    nayVotes: User[];
}

export const CreatePetition = async(petitionData: PetitionData) => {
    console.log(petitionData); 
    if(petitionData.proposedAmount){
        // first we will check the amount for any errors
        // if proposed amount < spent amount
        const categoryRef = doc(db, "groups", petitionData.groupId, "UserCategories", petitionData.categoryId);
        const categoryDoc = await getDoc(categoryRef);
        const currentCategoryData = categoryDoc.data();
        const spentAmount = currentCategoryData.spentAmount;
        const currentAllocatedAmount = currentCategoryData.allocatedAmount;
    
        if(petitionData.proposedAmount < spentAmount){
            Alert.alert(`${currentCategoryData.usernameResponsible} has already spent $${spentAmount}. You cannot propose an amount lower than this.`);
            return;
        }
    
        //next check if the proposed amount is higher than what is left to allocated for the budget
        const budgetRef = doc(db, "groups", petitionData.groupId, "EventBudgets", petitionData.eventBudgetId);
        const budgetDoc = await getDoc(budgetRef);
        const currentBudgetData = budgetDoc.data();
        const remainingBudgetAmount = currentBudgetData.remainingAmount;
        if(petitionData.proposedAmount > remainingBudgetAmount + currentAllocatedAmount){
            Alert.alert(`You have $${remainingBudgetAmount} left to allocate in this budget. Increase the budget amount to at least $${petitionData.proposedAmount - remainingBudgetAmount}`);
            return;
        }
    }

    if(petitionData.proposedUserResponsible){
        try{
        // check for any unconfirmed transactions
        const transactionsRef = collection(db, "payments");
        // query for the category Id and where confirmedByDebtor and Logger is true
        const q = query(transactionsRef,    
            where("categoryId", "==", petitionData.categoryId)
        );
        console.log(petitionData.categoryId);
        const querySnap = await getDocs(q);

        const hasUnconfirmedTransactions = querySnap.docs.some(doc => {
            const transaction = doc.data();
            console.log(transaction);
            return transaction.owedDetails.some(
                detail => detail.status === "partial confirmation" || detail.status === "pending"
            );
        });
        if (hasUnconfirmedTransactions) {
            Alert.alert("Some transactions are still pending action by the current user responsible. Resolve all of these to propose a new user responsible.");
            return;
        }
        }
        catch(error){
            console.log(error); 
        }
    }

    try{
        const petitionsRef = collection(db, "petitions");
        const petitionsDoc = doc(petitionsRef);
        const newPetitionData: PetitionData = {
            categoryId: petitionData.categoryId,
            categoryName: petitionData.categoryName,
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
        if (petitionData.proposedUserResponsible) {
            newPetitionData.proposedUserResponsible = petitionData.proposedUserResponsible;
        }
        await setDoc(petitionsDoc, newPetitionData);
        Alert.alert("Petition Created Successfully!");
    }
    catch(error){
        console.log("Error creating petition ", error);
    }
}
