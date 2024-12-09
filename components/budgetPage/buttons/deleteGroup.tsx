/**
 * note! this will delete all transactions, expenses, and categories associated with this group
 * are you sure?
 */

import { Alert, Pressable, StyleSheet, Text, TouchableOpacity } from "react-native"
import { DeleteGroup } from "../../../backend/groupFunctions/deleteGroup"
import { auth } from "../../../firebaseConfig";

interface DeleteButtonProps{
    groupId: string;
    // we need onDelete to clear out the group state (i.e, if a user is set in a group than they delete it)
    onDelete?: () => void;
}

export const DeleteGroupButton = ({groupId, onDelete}: DeleteButtonProps) => {
    const userId = auth.currentUser?.uid;
    const handleDelete = async() => {
        // throw an alert button
        Alert.alert(
            "Delete Group",
            "This will delete all transactions, expenses, and budgets associated with this group. Are you sure?",
            [   // cancel button
                {
                    text: "Cancel",
                    style: "cancel"
                },
                // confirme deletion onpress call delete group
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try{
                            const deleteResult = await DeleteGroup(userId, groupId);
                            if(deleteResult === "Group Deleted!"){
                                onDelete?.();
                            }
                            else if(deleteResult === "Only Group Owners can delete groups!"){
                                Alert.alert(deleteResult);
                            }
                            else{
                                Alert.alert("Failed deleting group.");
                            }
                        } catch(error){
                            Alert.alert(error);
                        }
                    }
                }
            ]
        )
    }

    return(
        <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
    )

}

const styles = StyleSheet.create({
    deleteButton: {
        color: 'red'
    }
})