
import { View, StyleSheet } from 'react-native';
import { ViewEventBudgets } from "../viewBudgets/viewEvents";
import { CreateEventBudgetButton } from '../buttons/events/eventBudgetButton';

export default function EventBudgetPage() {
    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <CreateEventBudgetButton />
            </View>
            <View style={styles.budgetListContainer}>
                <ViewEventBudgets />
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
    budgetListContainer: {
        flex: 1,
        width: '100%',
    }
});


