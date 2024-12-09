import { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { FetchEventBudgetCategories } from "../../../../backend/budgetFunctions/eventBudget/fetchEventCategories";
import { useGroup } from "../../../../backend/globalState/groupContext";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../../firebaseConfig";
import { GetGroupNames } from "../../../../backend/fetchUsers";
import { CreatePetition } from "../../../../backend/petitionFunctions/createPetition";
import { doc, getDoc } from "firebase/firestore";

/**
 * this will create a petition to change a category in the budget
 */

interface User {
    userId: string;
    username: string;
}

interface PetitionData {
    categoryId: string;
    type: string;
    categoryName: string;
    eventBudgetId: string;
    groupId: string;
    expiresAt: Date;
    proposedAt: Date;
    description: string;
    passed: boolean;
    proposedBy: User;
    proposedName?: string;
    proposedAmount?: number;
    proposedUserResponsible?: User;
    isComplete: boolean;
    yayVotes: User[];
    nayVotes: User[];
}

interface Category {
    allocatedAmount: number,
    categoryName: string,
    eventBudgetId: string,
    id: string,
    spentAmount: number,
    userIdResponsible: string,
    usernameResponsible: string
}

export const CreateCategoryPetitionButton = ({eventBudgetId}: any) => {
    const [page, setPage] = useState(0);
    const [currentUsername, setCurrentUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [petitionType, setPetitionType] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({});
    const [petitionModalVisible, setPetitionModalVisible] = useState(false);
    const [changeType, setChangeType] = useState<'name' | 'amount' | 'user' | ''>('');
    const [petitionDetails, setPetitionDetails] = useState({
        proposedName: '',
        proposedAmount: '',
        proposedUser: [],
        description: ''
    });
    
    let cachedCategoryResponse = null;
    const {group} = useGroup();
    const user = auth.currentUser;
    const userId = user?.uid;

    const togglePetitionModal = () => {
        setPetitionModalVisible(!petitionModalVisible);
    }

        // cant really setup a listener for categories, need to query to grab
    // fake caching to reduce re rendering of categories state
    const grabCategoryData = async() => {
        if(cachedCategoryResponse){
            setCategories(cachedCategoryResponse);
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
            // grab the group names of everyone for choosing new user responsible
            const eventBudgetCategoryData = await FetchEventBudgetCategories(group.groupId, eventBudgetId);
            cachedCategoryResponse = eventBudgetCategoryData;
            const users = await GetGroupNames(group.groupId);
            setGroupMembers(users);
            setCategories(eventBudgetCategoryData);
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

    const handleSubmit = async() => {
        if(!selectedCategory){
            return;
        }
        if(!petitionDetails.description){
            Alert.alert("Description for a petition is required!");
            return;
        }
        const petitionData: PetitionData = {
            categoryId: selectedCategory.id,
            type: "Category",
            categoryName: selectedCategory.categoryName,
            eventBudgetId: eventBudgetId,
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
        };
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
            case 'user':
                if (!petitionDetails.proposedUser || petitionDetails.proposedUser.length !== 2 || 
                    !petitionDetails.proposedUser[0] || !petitionDetails.proposedUser[1]) {
                    Alert.alert('Select a new user responsible!');
                    return;
                }
                petitionData.proposedUserResponsible = {
                    userId: petitionDetails.proposedUser[0],
                    username: petitionDetails.proposedUser[1]
                };
                break;
        }
        try{
            await CreatePetition(petitionData)
            //reset form
            togglePetitionModal();
            setPage(0);
            setSelectedCategory(null);
            setPetitionDetails({
                proposedName: '',
                proposedAmount: '',
                proposedUser: [],
                description: ''
            })
        }   
        catch(error){
            console.log(error);
        }        
    }
    
    const renderModalContent = () => {
        switch(page){
            case 0:
                return (
                    <View>
                        <Text style={{alignSelf: 'center', fontWeight: 'bold', paddingTop: 10}}>Choose a category for your petition</Text>
                        {categories.map(category => (
                            <TouchableOpacity
                            key={category.id}
                            style={styles.optionButton}
                            onPress={() => {
                                setSelectedCategory(category)
                                setPage(1)
                            }}
                            >
                                <Text style={{color: 'white'}}>Name: {category.categoryName}</Text>
                                <Text style={{color: 'white'}}>Allocated Amount: ${category.allocatedAmount}</Text>
                                <Text style={{color: 'white'}}>User Responsible: {category.usernameResponsible}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            case 1:
                return(
                    <View>
                        <Text style={styles.modalTitle}>
                            Modify {selectedCategory?.categoryName}
                        </Text>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                setChangeType('name');
                                setPage(2);
                            }}
                        >
                            <Text style={{color: 'white'}}>Change Category Name</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                setChangeType('amount');
                                setPage(2);
                            }}
                        >
                            <Text style={{color: 'white'}}>Change Allocated Amount</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                setChangeType('user');
                                setPage(2);
                            }}
                        >
                            <Text style={{color: 'white'}}>Change User Responsible</Text>
                        </TouchableOpacity>
                    </View>
                )
            case 2: 
                return (
                    <View>
                        <Text style={styles.modalTitle}>
                            {changeType === 'name' && 'New Category Name'}
                            {changeType === 'amount' && 'New Allocated Amount'}
                            {changeType === 'user' && 'New User Responsible'}
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
                        {changeType === 'user' && (
                        <View>
                            <Text style={styles.modalTitle}>Choose a New User Responsible</Text>
                            {groupMembers.map((groupMember) => (
                                groupMember.userId !== selectedCategory.userIdResponsible && (
                                <TouchableOpacity
                                    key={groupMember.id} 
                                    style={petitionDetails.proposedUser[1] === groupMember.username ? styles.selectedMember : styles.member}
                                    onPress={() => setPetitionDetails((prev) => ({
                                    ...prev,
                                    proposedUser: [groupMember.userId, groupMember.username],
                                    }))}
                                    >
                                <Text>{groupMember.username}</Text>
                                </TouchableOpacity>
                                )
                            ))}
                        </View>
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
                );
            
            default:
                return null;
        }
    }

    return (
        <View>
            <TouchableOpacity onPress={grabCategoryData}>
                <Text style={styles.startPetitionText}> Start a Category Petition</Text>
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
    selectedMember: {
        backgroundColor: 'white',
        color: '#003f7f',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
    },
    member: {
        backgroundColor: '#003f7f',
        color: 'white',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
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