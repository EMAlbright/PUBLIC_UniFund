/**
 * this will create a petition to change the budget
 */

import { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { FetchEventBudgetCategories } from "../../../../backend/budgetFunctions/eventBudget/fetchEventCategories";
import { useGroup } from "../../../../backend/globalState/groupContext";
import { Ionicons } from "@expo/vector-icons";
import { GetBudgetData } from "../../../../backend/budgetFunctions/eventBudget/fetchEventBudget";
import { auth, db } from "../../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { CreateEventPetition } from "../../../../backend/petitionFunctions/createEventPetition";

interface User {
    userId: string,
    username: string
}

interface EventBudgetPetition {
    eventBudgetId: string;
    type: string;
    groupId: string;
    expiresAt: Date;
    proposedAt: Date;
    description: string;
    passed: boolean;
    proposedBy: User;
    proposedName?: string;
    proposedAmount?: number;
    isComplete: boolean;
    yayVotes: User[];
    nayVotes: User[];
}

interface EventBudget {
 name: string;
 plannedAmount: number;
}

export const CreateBudgetPetitionButton = ({eventBudgetId}: any) => {
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [budgetData, setBudgetData] = useState<EventBudget>(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [budget, setBudget] = useState({});
    const [currentUsername, setCurrentUsername] = useState('');
    const [petitionModalVisible, setPetitionModalVisible] = useState(false);
    const [changeType, setChangeType] = useState<'name' | 'amount' | ''>('');

    let cachedBudgetResponse = null;
    const user = auth.currentUser;
    const userId = user?.uid;

    const [petitionDetails, setPetitionDetails] = useState({
        proposedName: '',
        proposedAmount: '',
        description: ''
    });

    const {group} = useGroup();

    const togglePetitionModal = () => {
        setPetitionModalVisible(!petitionModalVisible);
    }

    const grabBudgetData = async() => {
        if(cachedBudgetResponse){
            setBudget(cachedBudgetResponse)
            togglePetitionModal();
            return;
        }
        if(user){
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setCurrentUsername(userDoc.data().profile.username);
            }
        }
        try{
            setLoading(true);
            const budgetData = await GetBudgetData(eventBudgetId, group.groupId);
            cachedBudgetResponse = budgetData;
            setBudget(budgetData);
            console.log(budgetData);
        }
        catch(error){
            console.log(error);
        }
        finally{
            setLoading(false);
        }
        togglePetitionModal();
    }

    const petitioningUser: User = {
        userId: userId,
        username: currentUsername
    }

    const petitionData: EventBudgetPetition = {
        eventBudgetId: eventBudgetId,
        type: "EventBudget",
        groupId: group.groupId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
        proposedAt: new Date(),
        description: petitionDetails.description,
        passed: false,
        proposedBy: {
            userId: userId || '',
            username: currentUsername || 'Unknown User'
        },
        isComplete: false,
        yayVotes: [petitioningUser],
        nayVotes: []
    }

    const handleSubmit = async() => {
        if(!petitionDetails.description){
            Alert.alert("Description for a petition is required!");
            return;
        }

        switch(changeType) {
            case 'name':
                if(!petitionDetails.proposedName || petitionDetails.proposedName.trim() === ''){
                    Alert.alert('Enter a new name!');
                    return;
                }
                petitionData.proposedName = petitionDetails.proposedName;
                break;
            case 'amount':
                const proposedAmount = parseFloat(petitionDetails.proposedAmount);
                if(isNaN(proposedAmount) || proposedAmount <= 0){
                    Alert.alert('Enter a valid amount!');
                    return;
                }
                petitionData.proposedAmount = proposedAmount;
                break;
        }

        await CreateEventPetition(petitionData);
        togglePetitionModal();
        //reset form
        setPetitionDetails({
            proposedAmount: '',
            proposedName: '',
            description: ''
        })
    }
    
    const renderModalContent = () => {
        switch(page) {
            case 0:
                return(
                    <View>
                        <Text style={styles.modalTitle}>
                            Modify Budget
                        </Text>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                setChangeType('name');
                                setPage(1);
                            }}
                        >
                            <Text style={{color: 'white'}}>Change Budget Name</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                setChangeType('amount');
                                setPage(1);
                            }}
                        >
                            <Text style={{color: 'white'}}>Change Planned Amount</Text>
                        </TouchableOpacity>
                    </View>
                )
            case 1:
                return(
                <View>
                    <Text style={styles.modalTitle}>
                        {changeType === 'name' && 'New Budget Name'}
                        {changeType === 'amount' && 'New Planned Amount'}
                        </Text>
                        {changeType === 'name' && (
                    <TextInput
                        style={styles.input}
                        placeholder="New Category Name"
                        placeholderTextColor={'gray'}
                        value={petitionDetails.proposedName}
                        onChangeText={(text) => setPetitionDetails(prev => ({
                            ...prev, 
                            proposedName: text
                        }))}
                        />
                        )}
                        {changeType === 'amount' && (
                    <TextInput
                        style={styles.input}
                        placeholder="New Allocated Amount"
                        placeholderTextColor={'gray'}
                        keyboardType="numeric"
                        value={petitionDetails.proposedAmount}
                        onChangeText={(text) => setPetitionDetails(prev => ({
                            ...prev, 
                            proposedAmount: text
                        }))}
                        />
                        )}
                    <TextInput
                    style={styles.input}
                    placeholder="Reason for Change"
                    placeholderTextColor={'gray'}
                    multiline
                    value={petitionDetails.description}
                    onChangeText={(text) => setPetitionDetails(prev => ({
                        ...prev, 
                        description: text
                    }))}
                    />
                    <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    >
                        <Text style={styles.submitButtonText}>Submit Petition</Text>
                    </TouchableOpacity>
                </View>
                )
        }
    }

    return (
        <View>
            <TouchableOpacity onPress={grabBudgetData}>
                <Text style={styles.startPetitionText}> Start a Budget Petition</Text>
            </TouchableOpacity>
            <Modal
                animationType="slide"
                transparent={true}
                visible={petitionModalVisible}
                onRequestClose={togglePetitionModal}
            >
                <View style={styles.petitionModalOverlay}>
                    <View style={styles.petitionModalView}>
                        <ScrollView>
                            <View>
                                <Ionicons onPress={togglePetitionModal} name="close" size={35} />
                            </View>
                            {renderModalContent()}
                            {page > 0 && (
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setPage(page - 1)}
                                >
                                    <Text>Back</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    petitionModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    petitionModalView: {
        width: '75%',
        height: '55%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    startPetitionText:{
        color: 'white',
        alignSelf: 'center',
        fontWeight: 'bold',
        backgroundColor: '#003f7f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    closeButtonContainer: {
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    optionButton: {
        backgroundColor: '#003f7f',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginVertical: 10,
        borderRadius: 5,
    },
    submitButton: {
        backgroundColor: '#003f7f',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    backButton: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    }
})