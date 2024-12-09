import { doc, collection, where, query, deleteDoc,getDocs, updateDoc, getDoc } from "firebase/firestore";
import { addToGroup } from "./groupFunctions/addToGroup";
import { auth, db } from "../firebaseConfig";

/**
 * get the notifications if the type is groupInvite
 * once the user clicks accept and its verified they have join the group
 * the invite should be deleted from DB
 * there notification has been read
 */

/**
 * 
 * @param notification : accepts a notification object
 */

export const acceptInviteButton = async(notification) => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
   // const notificationRef = doc(db, "users", user.uid, "notifications", notification.groupid);
    // we do need to grab the group id from the notification
    //also need to pass in the group name
    try{
        await addToGroup(notification.groupId, notification.groupName, user.uid);
        // remove the notification once added to group
        const notificationsRef = collection(db, "users", user.uid, "notifications");
        const q = query(notificationsRef, where("groupId", "==", notification.groupId), where("notificationType", "==", "groupInvite"));
        const querySnapshot = await getDocs(q);
        //delete notification that was accepted
        querySnapshot.forEach(async (document) => {
            await deleteDoc(doc(db, "users", user.uid, "notifications", document.id));
        }); 
        const currentNotificationDoc = await getDoc(userRef);
        const currentNotificationCount = currentNotificationDoc.data().notificationCount;
        await updateDoc(doc(db, "users", user.uid), {
            notificationCount: currentNotificationCount - 1
        })

    }
    catch(error){
        throw new Error("Error in accepting the invite")
    }
}