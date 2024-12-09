
/**
 * below the add an expense, display every category within each expense
 */
        /**
         * go through every event budget in the group
         * grab each category from each event budget
         * rewrite this so that it only displays the categories you are responsible for
         * 
         * so go through and grab every category where auth.currentuser.uid === userIdResponsible
         * after grabbing category infomration, grab the event budget associated with the category
         * 
         * then display a list where it has event budget, categories you are responsible for
         * Expenses Page
            ├── [Event Budget Name] — [Total Allocated | Total Spent | Remaining]
            │    ├── Current User's Categories
            │    │    ├── Category: Food - $500 allocated
            │    │    │    ├── Spent: $250
            │    │    │    └── Remaining: $250
            │    │    └── [Item List] -> (e.g., Lunch at $20)
            │    └── Group Summary (Collapsible)
            │         ├── Total Group Spending: $2000
            │         └── Remaining Budget: $1000
            └── Other Members' Categories (optional, expandable for privacy)
                ├── Category: Venue - $1000 allocated
                └── Responsible: [User Name]

         */

import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useGroup } from "../../../backend/globalState/groupContext";
import { collection, doc, onSnapshot, DocumentData } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import { GetBudgetData } from "../../../backend/budgetFunctions/eventBudget/fetchEventBudget";

interface EventCategory {
    allocatedAmount: number;
    categoryName: string;
    eventBudgetId: string;
    spentAmount: number;
    userIdResponsible: string;
    usernameResponsible: string;
}

interface RecurringCategory {
    allocatedAmount: number;
    categoryName: string;
    frequency: string;
    recurringBudgetId: string;
    spentAmount: number;
    userIdResponsible: string;
    usernameResponsible: string;
}

// helper function to determine category type in firestore lsiteners
const isEventCategory = (category: DocumentData): category is EventCategory => {
    return 'eventBudgetId' in category;
};

const isRecurringCategory = (category: DocumentData): category is RecurringCategory => {
    return 'recurringBudgetId' in category;
};

interface EventBudget {
    categories: EventCategory[];
    date: string;
    eventBudgetName: string;
    eventDescription: string;
    numberOfCategories: number;
    plannedAmount: number;
    remainingAmount: number;
    spentAmount: number;
}

interface RecurringBudget {
    categories: RecurringCategory[];
    description: string;
    enableCategories: boolean;
    frequency: string;
    name: string;
    numberOfCategories: number;
    plannedAmount: number;
    remainingAmount: number;
    spentAmount: number;
}

interface OrganizedData {
    [key: string]: {
        budgetName: string;
        plannedAmount: number;
        totalSpent: number;
        remainingAmount: number;
        categories: (EventCategory | RecurringCategory)[];
        isRecurring: boolean;
        frequency?: string;
        date?: string;
    };
}

export const ViewCategories = () => {
    const [userCategories, setUserCategories] = useState<(EventCategory | RecurringCategory)[]>([]);
    const [eventBudgets, setEventBudgets] = useState<{ [key: string]: EventBudget }>({});
    const [recurringBudgets, setRecurringBudgets] = useState<{ [key: string]: RecurringBudget }>({});
    const [organizedData, setOrganizedData] = useState<OrganizedData>({});
    const [loading, setLoading] = useState(true);
    const {group} = useGroup();
    const user = auth.currentUser;

    // use effect, inside add a listener for grous and categories
    // state chagnes on grou change
    useEffect(() => {
        if (!group || !user) {
            setLoading(false);
            return;
        }
        // get refs for categories/ event and recurring budgets to listen to
        const categoryRef = collection(db, "groups", group.groupId, "UserCategories");
        const eventBudgetRef = collection(db, "groups", group.groupId, "EventBudgets");
        const recurringBudgetRef = collection(db, "groups", group.groupId, "RecurringBudgets");
        
        // grab all the data related to the category 
        const unsubscribeUserCategories = onSnapshot(categoryRef, (snapshot) => {
            const categories = snapshot.docs.map(doc => {
                const data = doc.data();
                // determine if its an event category or recurring category
                if (isEventCategory(data) || isRecurringCategory(data)) {
                    return data;
                }
                return null;
                // filter by category
            }).filter((category): category is (EventCategory | RecurringCategory) => category !== null);
            // set categories
            setUserCategories(categories);
        });
        
        // setup a listener for the event budgets too
        const unsubscribeEventBudgets = onSnapshot(eventBudgetRef, (snapshot) => {
            const budgetData = {};
            snapshot.docs.forEach(doc => {
                budgetData[doc.id] = doc.data() as EventBudget;
            });
            setEventBudgets(budgetData);
        });
        // setu listener for recurring budgets
        const unsubscribeRecurringBudgets = onSnapshot(recurringBudgetRef, (snapshot) => {
            const budgets = {};
            snapshot.docs.forEach(doc => {
                budgets[doc.id] = doc.data() as RecurringBudget;
            });
            setRecurringBudgets(budgets);
        });
        // clean up all the listeners
        return () => {
            unsubscribeUserCategories();
            unsubscribeEventBudgets();
            unsubscribeRecurringBudgets();
        };
    }, [group, user]);

    // use effect, event or category data change udates
    //check for new data
    useEffect(() => {

        if (userCategories.length > 0 && 
            (Object.keys(eventBudgets).length > 0 || Object.keys(recurringBudgets).length > 0)) {
            const organized: OrganizedData = {};

            userCategories.forEach(category => {
                if ('eventBudgetId' in category) {
                    // Handle event budget category
                    const budget = eventBudgets[category.eventBudgetId];
                    // set the key value for the category within the event budget id data
                    if (budget) {
                        if (!organized[category.eventBudgetId]) {
                            organized[category.eventBudgetId] = {
                                budgetName: budget.eventBudgetName,
                                plannedAmount: budget.plannedAmount,
                                totalSpent: budget.spentAmount,
                                remainingAmount: budget.remainingAmount,
                                categories: [],
                                isRecurring: false,
                                date: budget.date
                            };
                        }
                        organized[category.eventBudgetId].categories.push(category);
                    }
                } else if ('recurringBudgetId' in category) {
                    // Handle recurring budget category
                    const budget = recurringBudgets[category.recurringBudgetId];
                    // set the data for the recurring budget id if its not in there
                    if (budget) {
                        if (!organized[category.recurringBudgetId]) {
                            organized[category.recurringBudgetId] = {
                                budgetName: budget.name,
                                plannedAmount: budget.plannedAmount,
                                totalSpent: budget.spentAmount,
                                remainingAmount: budget.remainingAmount,
                                categories: [],
                                isRecurring: true,
                                frequency: budget.frequency
                            };
                        }
                        organized[category.recurringBudgetId].categories.push(category);
                    }
                }
            });

            setOrganizedData(organized);
            setLoading(false);
        }
    }, [userCategories, eventBudgets, recurringBudgets]);

    // if loading then display indicator else display the categories
    const renderBudgetSection = ([budgetId, budget]: [string, OrganizedData[string]]) => (
        // first map the main budgets
        <View key={budgetId} style={styles.eventBudgetSection}>
            <View style={styles.eventBudgetHeader}>
                <View style={styles.budgetTitleContainer}>
                    <Text style={styles.eventBudgetName}>
                        {budget.budgetName}
                    </Text>
                    <Text style={styles.budgetType}>
                        {budget.isRecurring 
                            ? `Recurring (${budget.frequency})` 
                            : `Event (${budget.date})`}
                    </Text>
                </View>
                <Text style={styles.budgetSummary}>
                    Spent: ${budget.totalSpent.toFixed(2)} / ${budget.plannedAmount.toFixed(2)}
                </Text>
                <Text style={styles.remainingAmount}>
                    Remaining: ${budget.remainingAmount.toFixed(2)}
                </Text>
            </View>
            {/**map each category within the budget */}
            {budget.categories.map((category, index) => (
                <View key={index} style={styles.categoryCard}>
                    <Text style={styles.categoryName}>
                        {category.categoryName}: {((category.allocatedAmount/budget.plannedAmount)*100).toFixed(2)}%
                    </Text>
                    <Text style={styles.categoryInfo}>
                        Responsible: {category.usernameResponsible}
                    </Text>
                    <View style={styles.budgetProgress}>
                        <Text style={styles.categoryInfo}>
                            ${(category.spentAmount || 0).toFixed(2)} / ${category.allocatedAmount.toFixed(2)}
                        </Text>
                        <Text style={[
                            styles.remainingAmount,
                            (category.allocatedAmount - (category.spentAmount || 0)) < 0 && styles.overBudget
                        ]}>
                            Remaining: ${(category.allocatedAmount - (category.spentAmount || 0)).toFixed(2)}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );

    // return each entry of organized data (the categories of event and recurring budgets)
    return (
        <SafeAreaView style={styles.container}>
            {Object.entries(organizedData).length > 0 ? (
                <ScrollView style={styles.scrollContainer}>
                    {Object.entries(organizedData).map(renderBudgetSection)}
                </ScrollView>
            ) : (
                <Text style={styles.nobudgetsText}>No categories found.</Text>
            )}
        </SafeAreaView>
    );
}

 const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#007bff',
    },
    budgetTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    scrollContainer: {
        flex: 1
    },
    budgetType: {
        fontSize: 14,
        color: '#7f8c8d',
        fontStyle: 'italic',
    },
    eventBudgetSection: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    eventBudgetHeader: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    eventBudgetName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    budgetSummary: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    nobudgetsText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    categoryCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#34495e',
        marginBottom: 4,
    },
    categoryInfo: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    budgetProgress: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    remainingAmount: {
        fontSize: 14,
        color: '#27ae60',
        fontWeight: '500',
    },
    overBudget: {
        color: '#e74c3c',
    },
 })
 