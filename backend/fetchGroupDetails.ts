import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface User {
    userId: string;
    username: string;
}

interface GroupData {
    members: User[];
    description: string;
}

export const GetGroupDetails = async (groupId: string): Promise<GroupData> => {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);
        
        if (!groupDoc.exists()) {
            throw new Error('Group not found');
        }

        const data = groupDoc.data();
        
        return {
            members: data.members || [],
            description: data.groupDescription || ''
        };
    } catch (error) {
        console.error('Error in GetGroupDetails:', error);
        throw error;
    }
}