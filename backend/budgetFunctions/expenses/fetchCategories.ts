/**
 * in this file we  need to fetch all the categories a user is resonsible for from their user collection
 * 
 * need to go back and when a user is assigned a category store that category in their collection
 * actually we can just loo
 */

import { collection, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";


export const GetCategories = async(userId: string, groupId: string) => {
    // user id passed is the current user
    // find all event budget categories where the user
    // first get all categories
    // if userId responsible is == to userId then add the category to array

    const categories = [];
    try{
        const q = query(collection(db, "groups", groupId, "UserCategories"), where("userIdResponsible", "==", userId))
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            categories.push({
                categoryId: doc.id,
                ...doc.data()
            });
        })
    } catch(error){
        console.log(error);
    }

    return categories;
}