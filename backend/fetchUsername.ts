import { collection, doc, getDoc } from "firebase/firestore"
import { db } from "../firebaseConfig";


export const FetchUsername = async(userId: string) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    return userDoc.data().profile.username;
}