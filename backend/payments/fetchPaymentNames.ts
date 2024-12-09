/**
 * @param paymentId
 * @returns the category name, group name
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export const FetchCategoryAndGroupNameFromPaymentId = async(paymentId: string) => {
    const paymentRef = doc(db, "payments", paymentId);
    const paymentDoc = await getDoc(paymentRef);
    const groupId = paymentDoc.data().groupId;
    console.log(groupId);
    const categoryId = paymentDoc.data().categoryId;

    const groupRef = doc(db, "groups", groupId);
    const categoryRef = doc(db, "groups", groupId, "UserCategories", categoryId);
    const groupDoc = await getDoc(groupRef);
    const categoryDoc = await getDoc(categoryRef);
    const categoryName = categoryDoc.data().categoryName;
    const groupName = groupDoc.data().groupName;

    return {"groupname": groupName, "categoryname": categoryName};
}