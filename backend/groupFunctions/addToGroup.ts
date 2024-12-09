import { db } from "../../firebaseConfig"
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * 
 * @param groupId 
 * @param userId 
 * 
 */
export const addToGroup = async(groupId: any, groupName: any, userId: string) => {
    try{
        // this might cause an error because groups collection is  within
        // each user. so might have to put groups at the same level of users
        // could have group collection at the same levels as user
        // but then also have another group collectinos inside of users
        // that has all the groups that user is apart of
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if(!groupDoc.exists()){
            throw new Error("group not found");
        }

       //check if the user is already in the group
        const groupData = groupDoc.data();
        if(groupData.members.includes(userId)){
            throw new Error("user already is in this group");
        }
        
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        const username = userDoc.data().profile.username;

        // else add the user to the group
        await updateDoc(groupRef, {
            members: arrayUnion({userId: userId, username: username, isOwner: false})
        });

        //remove the user from the invitedMembers
        // the person who created the group MUST invite them in order for someone
        // to create a group
        // so the user who was invited will always be in the invitedMembers field
        await updateDoc(groupRef, {
            invitedMembers: arrayRemove(userId)
        })


        // also add the group to the users groups collection
        await updateDoc(userRef, {
            groups: arrayUnion({ groupId: groupId, groupName: groupName, isOwner: false })
            // might need to grab group name as well
            // or can just grab the group id and search for it in
            // groups collection and pull the name
        });

        console.log("User, ", userId, " added to group: ", groupName);

    }
    catch(error) {
        console.log("error adding new member, ", error)
    }
}