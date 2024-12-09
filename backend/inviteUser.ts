import { updateDoc, arrayUnion, doc, setDoc, getDoc, addDoc, collection } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';
import { Alert } from "react-native";

// when we invite a user, we need to create a new collection or doc
// into the groups collection of the invited users
// vice versa, we also need to create a new collection or doc 
// into the users collection of the groups they have been invited to
export const inviteUser = async(userId: string, groupId: string, inviterName: string) => {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnapshot = await getDoc(groupRef);
        const groupData = groupSnapshot.data();
        // cant invite a user already in the group
        if(groupData.members.includes(userId)){
            return new Alert.alert("user already is in this group");
        } 
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        const groupName = groupSnapshot.data().groupName;

        // update the group collection to add the invited user
        await updateDoc(groupRef, {
            invitedMembers: arrayUnion(userId)
        });

        // update the user collection of groups they have been invited to        
        await updateDoc(userRef, {
            invitedGroups: arrayUnion({
                groupId: groupId,
                sentAt: new Date().toISOString()
            })
        });

        let notificationCount = userDoc.data().notificationCount || 0;
        await updateDoc(userRef, {
            notificationCount: notificationCount + 1
        });


        // handle notifications as well, send a notification to user
        // Add notification
        const notificationRef = collection(db, "users", userId, "notifications");
        await addDoc(notificationRef, {
            notificationType: "groupInvite",
            content: `${inviterName} invited you to join ${groupName}`,
            groupName,
            groupId,
            createdAt: new Date().toISOString(),
            read: false
        });

        console.log("User invited successfully");
    } catch (error) {
        console.error("Error inviting user:", error);
    }


}
