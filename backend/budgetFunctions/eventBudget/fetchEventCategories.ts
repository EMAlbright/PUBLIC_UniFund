import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
interface Category {
    allocatedAmount: number,
    categoryName: string,
    eventBudgetId: string,
    id: string,
    spentAmount: number,
    userIdResponsible: string,
    usernameResponsible: string
}
export const FetchEventBudgetCategories = async(groupId: string, eventBudgetId: string) => {
    try{
    //query for categories where event budget id is equal
    const categoryRef = collection(db, "groups", groupId, "UserCategories");
    
    const q = query(categoryRef, 
        where("eventBudgetId", "==", eventBudgetId)
    );
    const categoryDocs = await getDocs(q);
    const categoryData: Category[] = categoryDocs.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Category, 'id'>)
    }))
    return categoryData

    }
    catch(error){
        console.log("Error grabbing event budgets categories: ", error);
    }
}