/**
 * 
 * @param oldOwnerId userId of current owner
 * @param newOwnerId userId of new owner
 * @param groupId groupId to target in groups[] of each user
 */

import { doc, getDoc, writeBatch } from "firebase/firestore"
import { db } from "../../firebaseConfig"

export const UpdateGroupOwner = async(oldOwnerId: string, newOwnerId: string, groupId: string) => {
    // use batch to update simulatensouly
    const batch = writeBatch(db);
    try{
        const oldOwnerRef = doc(db, "users", oldOwnerId);
        const newOwnerRef = doc(db, "users", newOwnerId);
    
        const oldOwnerDoc = await getDoc(oldOwnerRef);
        const newOwnerDoc = await getDoc(newOwnerRef);
        
        const oldOwnerData = oldOwnerDoc.data();
        const newOwnerData = newOwnerDoc.data();

        const updateOld = oldOwnerData.groups.map((group: any) => {
            // update groups array once a group object id matches
            if(group.groupId === groupId){
                return {...group, isOwner: false};
            }
            return group;
        });

        const updateNew = newOwnerData.groups.map((group: any) => {
            // update groups array once a group object id matches
            if(group.groupId === groupId){
                return {...group, isOwner: true};
            }
            return group;
        });

        // batch update both
        batch.update(oldOwnerRef, {
            groups: updateOld
        });
        batch.update(newOwnerRef, {
            groups: updateNew
        });

        await batch.commit();
        return "Success!";

    }
    catch(error){
        console.log("Error transferring ownership ", error)
        return "Error!";
    }

}