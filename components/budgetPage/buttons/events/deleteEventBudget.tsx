/**
 * note! this will delete all transactions, expenses, and categories associated with this group
 * are you sure?
 */

import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native"
import { DeleteEventBudget } from "../../../../backend/budgetFunctions/eventBudget/deleteEventBudget";

interface DeleteButtonProps {
    groupId: string;
    eventBudgetId: string;
}

export const DeleteEventButton = ({groupId, eventBudgetId}: DeleteButtonProps) => {
    console.log("group: ", groupId);
    console.log("event id: ", eventBudgetId);
    const handleDelete = async() => {
        // throw an alert button
        Alert.alert(
            "Delete Event Budget",
            "This will delete all transactions, expenses, and categories associated with this budget. Are you sure?",
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
                            const deleteResult = await DeleteEventBudget(groupId, eventBudgetId);
                            if(deleteResult === "Event Budget Deleted!"){
                                Alert.alert("Event Budget Deleted!")
                            }
                            else{
                                Alert.alert("Failed deleting event budget.");
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