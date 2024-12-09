import { View, StyleSheet, Text } from 'react-native';
import { ViewCategories } from '../viewBudgets/viewCategories';
import { AddExpenseButton } from '../buttons/expenses/addExpenseButton';

export default function ExpensePage () {
    return (
    <View style={styles.container}>
        {/** add exense button */}
        <View style={styles.buttonContainer}>
            <AddExpenseButton />
        </View>
        {/** view all categories or exenses below it */}
        <View style={styles.expenseListContainer}>
            <ViewCategories />
        </View>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    buttonContainer: {
        alignSelf: 'center',
        alignContent: 'center',
        width: '50%',
    },
    expenseListContainer: {
        flex: 1,
        width: '100%',
    }
})