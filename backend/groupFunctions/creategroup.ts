import {auth, db} from "../../firebaseConfig";
import { doc, updateDoc, collection, setDoc, arrayUnion, getDoc } from 'firebase/firestore';

interface Group {
    id: string,
    groupName: string,
    groupDescription: string,
    members: any
}

export const createGroup = async(groupName: string, groupDescription: string) => {
    try{
        const user = auth.currentUser;
        const groupsRef = collection(db, "groups");
        // make new ref id to the groups
        const newGroup = doc(groupsRef);
        const groupId = newGroup.id;

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const username = userDoc.data().profile.username;

        // group data that is added to the grous collection
        const groupData: Group = {
            id: groupId,
            groupName,
            groupDescription,
            members: [{userId: user.uid, username: username, isOwner: true}]
        }

        // set the new group doc with new group ref and group data
        await setDoc(newGroup, groupData);

        // add the list of groups a user is in to the users collection
        await updateDoc(userRef, {
            groups: arrayUnion({ groupId: groupId, groupName: groupName, isOwner: true })
        });

        console.log("Group created by ", user.uid, ": ", groupName);

    }
    catch(error){
        console.log("error creating new group, ", error);
    }
}