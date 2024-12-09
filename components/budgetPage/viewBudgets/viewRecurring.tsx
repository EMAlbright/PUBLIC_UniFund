import { useGroup } from "../../../backend/globalState/groupContext";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { CreateRecurringCategoryButton } from "../buttons/recurring/createRecurringCategory";
import { DeleteRecurringButton } from "../buttons/recurring/deleteRecurringBudget";

export const ViewRecurringBudgets = () => {
    const [recurringBudgets, setRecurringBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { group } = useGroup();
    const user = auth.currentUser;
    const [isOwner, setIsOwner] = useState(false);
    const currUserId = user?.uid;
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    
    useEffect(() => { 
        setLoading(true);
        if (!group || !user) {
            setLoading(false);
            return;
        }  
        const nestedListeners = [];
    
        const userRef = doc(db, 'users', currUserId);
            
        const unsubscribeOwner = onSnapshot(userRef, (docSnapshot) => {
            const targetGroup = group.groupId;
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const groups = userData.groups || [];
                const group = groups.find((g: { groupId: string; isOwner: boolean }) => 
                    g.groupId === targetGroup
                );
                setIsOwner(group?.isOwner ?? false);
            }
        });
        nestedListeners.push(unsubscribeOwner);

        const recurringBudgetRef = collection(db, "groups", group.groupId, "RecurringBudgets");
        // func to listen for any changes to recurring budget
        const unsubscribe = onSnapshot(recurringBudgetRef, (querySnapshot) => {
            const budgets = querySnapshot.docs.map(doc => {
                return {
                    id: doc.id,
                    categories: [], 
                    ...doc.data()
                };
            });
            
            // Set up listeners for categories for each budget
            budgets.forEach(budget => {
                 // get category ref
                const categoryRef = doc(db, "groups", group.groupId, "RecurringBudgets", budget.id);
                // loop through and get categories
                const categoryUnsubscribe = onSnapshot(categoryRef, (docSnapshot) => {
                    const categoryData = docSnapshot.data()?.categories || [];
                    setRecurringBudgets(prevBudgets => 
                        // check if prevoius budget matches current budget
                        prevBudgets.map(prevBudget => 
                            // if it does update else keep previous
                            prevBudget.id === budget.id 
                                ? { ...prevBudget, categories: categoryData }
                                : prevBudget
                        )
                    );
                });
                nestedListeners.push(categoryUnsubscribe)
            });
            // set the recurring budgets
            setRecurringBudgets(budgets);
            setLoading(false);
        }, (error) => {
            console.log(error);
            setLoading(false);
        });

        return () => { 
            nestedListeners.forEach(unsub => unsub());
            unsubscribe();
        };
    }, [group, user]);
    
    if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        );
      }
    
    const renderCategories = ({ item }) => (
        <View style={styles.categoryItem}>
            <Text style={styles.categoryName}>{item.categoryName}</Text>
            <Text style={styles.categoryDetail}>Responsible: {item.usernameResponsible}</Text>
            <Text style={styles.categoryDetail}>Allocated: ${item.allocatedAmount}</Text>
        </View>
    );

    const renderRecurringBudget = ({ item }) => (
        
        <View style={styles.budgetItem}>
            <View style={styles.topRow}>
            <Text style={styles.budgetDeadline}>{item.frequency}</Text>
            {item.enableCategories && (
                <View style={styles.categoriesContainer}>
                <CreateRecurringCategoryButton recurringBudgetId={item.id}/>
                </View>
            )}
            </View>
            <Text style={styles.budgetName}>{item.name}</Text>
            {item.description && (
            <Text style={styles.budgetDescription}>{item.description}</Text>
            )}
            <Text style={item.plannedAmount > 0 ? styles.budgetPositive : styles.budgetNegative}>
                ${(item.plannedAmount).toFixed(2)}
            </Text>
            <Text>Spent ${(item.spentAmount).toFixed(2)}</Text>
            { /** allow user to click categories coiunt to view all of them */ }
            {item.enableCategories && (
            <View>
            <TouchableOpacity onPress={() => setSelectedBudgetId(item.id)}>
                <Text style={styles.categoryCount}>
                    {item.categories?.length || 0} categories
                </Text>
            </TouchableOpacity>
            <Modal
                visible={selectedBudgetId === item.id}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedBudgetId(null)}
            >
            <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{item.recurringBudgetName} Breakdown</Text>
                        { /** like recurring budgets pass in the data (item.categories and renderItem prop value to render) */ }
                        <FlatList
                            data={item.categories}
                            renderItem={renderCategories}
                            keyExtractor={(category, index) => index.toString()}
                            ListEmptyComponent={
                                <Text style={styles.noCategories}>No categories found</Text>
                            }
                        />
                        { /** set selected budget back to none to prrecurring modal always open */ }
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setSelectedBudgetId(null)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
            </View>
            </Modal>
            </View>
            )}
            {
                isOwner && (
                <View style={{paddingTop: 15}}>
                    <DeleteRecurringButton
                    groupId={group.groupId}
                    recurringBudgetId={item.id}
                    />
                </View>
                )
            }
        </View>
    );

    return (
        <View style={styles.budgetView}>
            {recurringBudgets.length > 0 ? (
                <FlatList
                    data={recurringBudgets}
                    renderItem={renderRecurringBudget}
                    keyExtractor={(item) => item.id}
                />
            ) : (
                <Text style={styles.nobudgetsText}>No recurring budgets found.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    budgetView: {
        flex: 1,
        width: '100%',
        paddingTop: 50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      categoriesContainer: {
        marginTop: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: '#2196F3',
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        marginTop: 15,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    categoryItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    categoryDetail: {
        fontSize: 14,
        color: '#666',
    },
    noCategories: {
        textAlign: 'center',
        padding: 20,
        color: '#666',
    },
    budgetItem: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
        width: '100%',
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    budgetDeadline: {
        fontSize: 16,
        fontWeight: 'bold',    
        paddingBottom: 10
    },
    budgetName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    budgetPositive: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'green'
    },
    budgetNegative: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'red'  
    },
    nobudgetsText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    loadingText: {
        textAlign: 'center'
    },
    categoryCount: {
        paddingTop: 10,
        fontWeight: 'bold'
    },
    budgetDescription:{
        color: 'black',
        paddingVertical: 10
    }
});