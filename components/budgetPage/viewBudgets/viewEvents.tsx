import { useGroup } from "../../../backend/globalState/groupContext";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { CreateEventCategoryButton } from "../buttons/events/createCategory";
import { DeleteEventButton } from "../buttons/events/deleteEventBudget";
import { PetitionPage } from "../pages/petitionDispute/petition";

export const ViewEventBudgets = () => {
    const [eventBudgets, setEventBudgets] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const { group } = useGroup();
    const user = auth.currentUser;
    const currUserId = user?.uid;
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    
    useEffect(() => { 
        if (!group || !user) {
            setLoading(false);
            return;
        }  
        // need to add an array of the nested unsubscribes
        // right now, only the to level listener stops when the user signs out
        // causing firestore listener error
        const nestedListeners = [];
        const groupRef = doc(db, "groups", group.groupId);
        const unsubscribeGroup = onSnapshot(
            groupRef, (docSnapshot) => {
                const groupMembers = docSnapshot.data().members;
                setMembers(groupMembers);
            }
        )
        nestedListeners.push(unsubscribeGroup);
        
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

        const eventBudgetRef = collection(db, "groups", group.groupId, "EventBudgets");
        // func to listen for any changes to event budget
        const unsubscribe = onSnapshot(eventBudgetRef, (querySnapshot) => {
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
                const categoryRef = doc(db, "groups", group.groupId, "EventBudgets", budget.id);
                // loop through and get categories
                // this listens for all the categories in event budget
                const categoryUnsubscribe = onSnapshot(categoryRef, (docSnapshot) => {
                    const categoryData = docSnapshot.data()?.categories || [];
                    setEventBudgets(prevBudgets => 
                        // check if prevoius budget matches current budget
                        prevBudgets.map(prevBudget => 
                            // if it does update else keep previous
                            prevBudget.id === budget.id 
                                ? { ...prevBudget, categories: categoryData }
                                : prevBudget
                        )
                    );
                });
                nestedListeners.push(categoryUnsubscribe);
            });
            // set the event budgets
            setEventBudgets(budgets);
            setLoading(false);
        }, (error) => {
            console.log("error in event listener ", error);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            nestedListeners.forEach(unsub => unsub());
        }
    }, [user, group]);
    
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

    const renderEventBudget = ({ item }) => (
        <View style={styles.budgetItem}>
            <View style={styles.topRow}>
                <Text style={styles.budgetDeadline}>{item.date}</Text>
                <CreateEventCategoryButton eventBudgetId={item.id}/>
            </View>
            <Text style={styles.budgetName}>{item.eventBudgetName}</Text>
            <Text style={item.plannedAmount > 0 ? styles.budgetPositive : styles.budgetNegative}>
                ${item.plannedAmount}
            </Text>
            <Text>Spent ${(item.spentAmount).toFixed(2)}</Text>
            { /** allow user to click categories coiunt to view all of them */ }
            { /** allow user to click categories coiunt to view all of them */ }
            <View>
            <TouchableOpacity onPress={() => setSelectedBudgetId(item.id)}>
                <Text style={styles.categoryCount}>
                    {item.categories?.length || 0} categories
                </Text>
            </TouchableOpacity>
            <View style={styles.bottomRow}>
            {
                isOwner && (
                    <View style={{paddingTop: 15}}>
                    <DeleteEventButton
                        groupId={group.groupId}
                        eventBudgetId={item.id}
                    />
                    </View>
                )
            }
            <View style={{paddingRight: 5}}>
                {
                    members.length > 1 && (
                        <PetitionPage
                        eventBudgetId={item.id}
                    />
                    )
                }
            </View>
            </View>
            </View>
            { /** modal to view all the categories in an event budget */ }
            { /** this is only visible when the user selects their numbered categories*/ }
            { /** once that is clicked, we assign selectedBudgetId  */ }
            <Modal
                visible={selectedBudgetId === item.id}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedBudgetId(null)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{item.eventBudgetName} Breakdown</Text>
                        { /** like event budgets pass in the data (item.categories and renderItem prop value to render) */ }
                        <FlatList
                            data={item.categories}
                            renderItem={renderCategories}
                            keyExtractor={(category, index) => index.toString()}
                            ListEmptyComponent={
                                <Text style={styles.noCategories}>No categories found</Text>
                            }
                        />
                        { /** set selected budget back to none to prevent modal always open */ }
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
    );

    return (
        <View style={styles.budgetView}>
            {eventBudgets.length > 0 ? (
                <FlatList
                    data={eventBudgets}
                    renderItem={renderEventBudget}
                    keyExtractor={(item) => item.id}
                />
            ) : (
                <Text style={styles.nobudgetsText}>No event budgets found.</Text>
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
    bottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    budgetDeadline: {
        fontSize: 12,
        fontWeight: 'bold',    
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
    }
});