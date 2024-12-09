import { StyleSheet, Text, View } from "react-native";
import { CreateRecurringBudgetButton } from "../buttons/recurring/createRecurringBudget";
import { ViewRecurringBudgets } from "../viewBudgets/viewRecurring";

export const RecurringBudgetPage = () => {
    return(
            <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <CreateRecurringBudgetButton />
            </View>
            <View style={styles.budgetListContainer}>
                <ViewRecurringBudgets />
            </View>
        </View>   
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%'
    },
    buttonContainer: {
        alignSelf: 'center',
        alignContent: 'center',
        width: '60%',
    },
    budgetListContainer: {
        flex: 1,
        width: '100%',
    }
});