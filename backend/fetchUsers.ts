
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * @param GroupId
 * @returns an Array of Usernames in the groupId
 * 
 * all this does right now is get a username
 * 
 */


export const GetGroupNames = async(groupId: string): Promise<string[]> => {
    
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    if(!groupDoc || !groupRef){
        console.log("no group doc or ref");
    }
    try{
        const memberNames = groupDoc.data().members;
        // member names now the array of member user IDs
        // query through users to get usernames
        return memberNames;
    }
    catch(error){
        console.log(error);
    }
}