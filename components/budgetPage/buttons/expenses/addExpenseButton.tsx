import { View, TextInput, Text, ActivityIndicator, TouchableOpacity, Modal, Dimensions, Button, StyleSheet, Pressable, Alert } from "react-native";
import Slider from '@react-native-community/slider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GetCategories } from "../../../../backend/budgetFunctions/expenses/fetchCategories";
import { useGroup } from "../../../../backend/globalState/groupContext";
import { auth, db } from "../../../../firebaseConfig";
import { useState, useEffect } from "react";
import { GetGroupNames } from "../../../../backend/fetchUsers";
import { CreateExpense } from "../../../../backend/budgetFunctions/expenses/addExpense";
import { doc, getDoc } from "firebase/firestore";

interface Category {
    categoryId: string,
    allocatedAmount: number,
    categoryName: string,
    eventBudgetId?: string,
    recurringBudgetId?: string,
    spentAmount: number,
    userIdResponsible: string,
    usernameResponsible: string,
}

interface SplitDetails {
    userId: string,
    amountOwed: number,
}

export const AddExpenseButton = () => {
    const [inputValues, setInputValues] = useState<{ [key: number]: string }>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [splitDetails, setSplitDetails] = useState<SplitDetails[]>([]);
    const [expenseCreaterUsername, setExpenseCreaterUsername] = useState("");
    const [members, setMembers] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [categoryAmountRemaining, setCategoryAmountRemaining] = useState(0);
    const [modalPage, setModalPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const {group} = useGroup();
    const userId = auth.currentUser.uid;

    const roundToTwoDecimals = (num: number): number => {
        return Math.round(num * 100) / 100;
    };

    // function to distribute split amounts evenly with rounding
    const calculateEvenSplit = (totalAmount: number, numPeople: number): number[] => {
        const perPersonAmount = roundToTwoDecimals(totalAmount / numPeople);
        const amounts = new Array(numPeople).fill(perPersonAmount);
        
        // Calculate any remaining amount due to rounding
        const totalAfterSplit = roundToTwoDecimals(perPersonAmount * numPeople);
        let remainder = roundToTwoDecimals(totalAmount - totalAfterSplit);
        
        // If there's any remainder, distribute it one cent at a time
        let index = 0;
        while (remainder > 0) {
            amounts[index] = roundToTwoDecimals(amounts[index] + 0.01);
            remainder = roundToTwoDecimals(remainder - 0.01);
            index = (index + 1) % numPeople;
        }
        
        return amounts;
    };

    useEffect(() => {
        const newInputValues = {};
        splitDetails.forEach((detail, index) => {
            newInputValues[index] = detail.amountOwed.toFixed(2);
        });
        setInputValues(newInputValues);
    }, [amount]);

    useEffect(() => {
        // update state for categoryAmountRemaining whenever selectedCategory changes
        if (selectedCategory) {
            setCategoryAmountRemaining(selectedCategory.allocatedAmount - selectedCategory.spentAmount);
        }
    }, [selectedCategory]);

    // set the  initial state of split details to equal amount
    // for every user
    useEffect(() => {
        if (amount && members.length > 0) {
            const splitAmounts = calculateEvenSplit(amount, members.length);
            const initialSplits = members.map((member, index) => ({
                userId: member.userId,
                amountOwed: splitAmounts[index]
            }));
            setSplitDetails(initialSplits);

            const newInputValues = {};
            initialSplits.forEach((split, index) => {
                newInputValues[index] = split.amountOwed.toFixed(2);
            });
            setInputValues(newInputValues);
        }
    }, [amount, members]);

    const toggleModal = () => {
        setModalVisible(!modalVisible);
        //rest all values to normal
        setSelectedCategory(null);
        setAmount(0);
        setModalPage(1);
    }

    const displayUserCategories = async() => {
        setLoading(true);
        try {
            const username = doc(db, "users", userId);
            const usernameData = await getDoc(username)
            setExpenseCreaterUsername(usernameData.data().profile.username);
            // get all categories that the user is responsible gor
            const categories = await GetCategories(userId, group.groupId);
            //get members of group
            const members = await GetGroupNames(group.groupId);
            setCategories(categories);
            setMembers(members);
        } catch(error) {
            console.error("Error getting the users categories:", error);   
        } finally {
            setLoading(false);
            toggleModal();
        }
    }
    // get the current total split
    // split amount has to equal logged expense amount
    const getTotalSplit = () => {
        return roundToTwoDecimals(splitDetails.reduce((sum, detail) => sum + detail.amountOwed, 0));
    };
    // needs to pass in the expense budget id, group id, 
    // ARRAY of map that has UserX: amountOwed

    const submitExpense = async() => { 
        toggleModal();
        if(selectedCategory.eventBudgetId){
            const expenseData = {
                expenseCreaterUserId: userId,
                expenseCreaterUsername:expenseCreaterUsername,
                categoryId: selectedCategory.categoryId,
                groupId: group.groupId,
                eventBudgetId: selectedCategory.eventBudgetId,
                spentAmount: amount,
                splitDetails: splitDetails.map(detail => ({
                    ...detail,
                    amountOwed: roundToTwoDecimals(detail.amountOwed)
                }))
            };
            await CreateExpense(expenseData);
        }
        else if (selectedCategory.recurringBudgetId){
            const expenseData = {
                expenseCreaterUserId: userId,
                expenseCreaterUsername:expenseCreaterUsername,
                categoryId: selectedCategory.categoryId,
                groupId: group.groupId,
                recurringBudgetId: selectedCategory.recurringBudgetId,
                spentAmount: amount,
                splitDetails: splitDetails.map(detail => ({
                    ...detail,
                    amountOwed: roundToTwoDecimals(detail.amountOwed)
                }))
            };
            await CreateExpense(expenseData);
        }
    }
    
    const handleSplitAmountChange = (text: string, index: number) => {
        // Update the input value immediately for smooth typing
        setInputValues(prev => ({
            ...prev,
            [index]: text
        }));

        // Only update the actual split if the value is valid
        if (text === '') {
            const newSplitDetails = [...splitDetails];
            newSplitDetails[index].amountOwed = 0;
            setSplitDetails(newSplitDetails);
        } else {
            const newAmount = parseFloat(text);
            if (!isNaN(newAmount)) {
                const newSplitDetails = [...splitDetails];
                newSplitDetails[index].amountOwed = roundToTwoDecimals(newAmount);
                setSplitDetails(newSplitDetails);
            }
        }
    };

    const handleSubmitExpense = () => {
        const totalSplit = getTotalSplit();
        if (roundToTwoDecimals(totalSplit) !== roundToTwoDecimals(amount)) {
            Alert.alert(
                "Split Amount Mismatch",
                `Split amount must equal expense of $${amount.toFixed(2)}`,
                [{ text: "OK" }]
            );
            return;
        }
        submitExpense();
    };

    const renderModalContent = () => {
        switch(modalPage) {
            // first page of modal
            // user clicks the category they are logging an expense to
            case 1:
                return (
                    <View style={styles.modalPageContent}>
                        <Text style={styles.modalTitle}>Select category to add an expense to:</Text>
                        {categories.map((category, index) => (
                            <TouchableOpacity 
                                key={index} 
                                onPress={() => setSelectedCategory(category) }
                                style={[
                                    styles.categoryButton,
                                    category === selectedCategory && styles.selectedCategory
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    category === selectedCategory && styles.selectedCategoryText
                                ]}>
                                    {category.categoryName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.buttonContainer}>
                            <Pressable style={styles.cancelButton} onPress={toggleModal}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </Pressable>
                            {selectedCategory && (
                                <Pressable 
                                    style={styles.nextButton}
                                    onPress={() => setModalPage(2)}
                                >                       
                                    <Ionicons name="arrow-forward" size={20} color="white" />
                                </Pressable>
                            )}
                        </View>
                    </View>
                );
            
            // second page of modal log expense
            case 2:
                return (
                    <View style={styles.modalPageContent}>
                        <Text style={styles.modalTitle}>How much did you spend?</Text>
                        <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
                        <Text style={styles.remainingText}>
                            Remaining amount for {selectedCategory.categoryName}: ${categoryAmountRemaining.toFixed(2)}
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={categoryAmountRemaining}
                            value={Number(amount.toFixed(2))}
                            onValueChange={setAmount}
                            step={0.05}
                            minimumTrackTintColor="#007AFF"
                            maximumTrackTintColor="#DEDEDE"
                            thumbTintColor="#007AFF"
                        />
                        {/** if amount is 0, cant move onto next page */}
                        <View style={styles.buttonContainer}>
                            <Pressable style={styles.nextButton} onPress={() => setModalPage(1)}>
                                <Ionicons name="arrow-back" size={20} color="white" />
                            </Pressable>
                            <Pressable 
                                style={[styles.nextButton, amount === 0 && styles.disabledButton]}
                                onPress={() => amount > 0 && setModalPage(3)}
                                disabled={amount === 0}
                            >
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </Pressable>
                        </View>
                    </View>
                );
            
            // user decided to custom or equal split
            case 3:
                const totalSplit = getTotalSplit();
                const remainingToSplit = roundToTwoDecimals(amount - totalSplit);
                return (
                    <View style={styles.modalPageContent}>
                        <Text style={styles.modalTitle}>Split ${amount.toFixed(2)} expense:</Text>
                        {remainingToSplit !== 0 && (
                            <Text style={{color: 'red'}}>
                                Amount left to split: ${remainingToSplit.toFixed(2)}
                            </Text>
                        )}
                        <View style={styles.splitContainer}>
                            {members.map((member, index) => (
                                <View key={index} style={styles.memberRow}>
                                    <Text style={styles.memberName}>{member.username}</Text>
                                    <View style={styles.amountInputContainer}>
                                        <Text style={styles.dollarSign}>$</Text>
                                        <TextInput
                                            style={styles.amountInput}
                                            keyboardType="decimal-pad"
                                            value={inputValues[index] || ''}
                                            onChangeText={(text) => handleSplitAmountChange(text, index)}
                                            maxLength={10}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.buttonContainer}>
                            <Pressable style={styles.nextButton} onPress={() => setModalPage(2)}>
                                <Ionicons name="arrow-back" size={20} color="white" />
                            </Pressable>
                            <Pressable 
                                style={styles.submitButton} 
                                onPress={handleSubmitExpense}
                            >
                                <Text style={styles.buttonText}>Submit</Text>
                            </Pressable>
                        </View>
                    </View>
                );
        }
    };
    

    return (
        <View>
            <TouchableOpacity 
                style={styles.expenseButton}
                onPress={displayUserCategories}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator />
                ) : (
                    <Text style={styles.expenseText}>Add Expense+</Text>
                )}
            </TouchableOpacity>
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={toggleModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        {renderModalContent()}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        maxHeight: '80%',
    },
    modalPageContent: {
        width: '100%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color:'#003f7f'
    },
    categoryButton: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
    },
    selectedCategory: {
        backgroundColor: '#007AFF',
    },
    categoryText: {
        fontSize: 16,
    },
    selectedCategoryText: {
        color: 'white',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dollarSign: {
        fontSize: 16,
        color: '#333',
    },
    amountInput: {
        fontSize: 16,
        padding: 8,
        minWidth: 80,
        textAlign: 'right',
    },
    expenseText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    expenseButton: {
        backgroundColor: '#003f7f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    nextButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 25,
    },
    disabledButton: {
        backgroundColor: '#CCCCCC',
    },
    cancelButton: {
        backgroundColor: '#d9534f',
        padding: 12,
        borderRadius: 25,
    },
    submitButton: {
        backgroundColor: '#003f7f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    amountText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    remainingText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    slider: {
        width: Dimensions.get('window').width * 0.7,
        height: 40,
    },
    splitContainer: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
    },
    splitTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    memberName: {
        fontSize: 14,
    },
    memberAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    customSplitContainer: {

    }
});