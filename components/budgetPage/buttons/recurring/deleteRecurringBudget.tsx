/**
 * note! this will delete all transactions, expenses, and categories associated with this group
 * are you sure?
 */

import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native"
import { DeleteRecurringBudget } from "../../../../backend/budgetFunctions/recurringBudget/deleteRecurringBudget";

interface DeleteButtonProps {
    groupId: string;
    recurringBudgetId: string;
}

export const DeleteRecurringButton = ({groupId, recurringBudgetId}: DeleteButtonProps) => {
    console.log(recurringBudgetId);
    const handleDelete = async() => {
        // throw an alert button
        Alert.alert(
            "Delete Recurring Budget",
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
                            const deleteResult = await DeleteRecurringBudget(groupId, recurringBudgetId);
                            if(deleteResult === "Recurring Budget Deleted!"){
                                Alert.alert("Recurring Budget Deleted!")
                            }
                            else{
                                Alert.alert("Failed deleting recurring budget.");
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