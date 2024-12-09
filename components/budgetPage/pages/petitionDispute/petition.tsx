
/**
 * 
 * @param eventBudgetId
 * 
 * !!need to add a petitions collection at root!!
 * 
 * this will be the main page (modal rather) when Petitions is clicked on an event budget
 * 
 * Should have X in the top left to close out
 * swipable naviaget like the transsactions page to go between
 * Petitions and Disputes
 * 
 * Member/Owners can: 
 * VIEW ALL PETITIONS AND DISPUTES
 * CREATE A PETITION
* 
 * EVERY MEMBER (including owners) CAN ONLY SUBMITE 1 PETITION every 3 days
 * EVERY MEMBER (including owners) CAN ONLY SUBMIT 1 DISPUTE every 1 day   
 * 
 * In PETITIONS, you can either:
 * 
 * A.) Petition to change the budgets AMOUNT, DEADLINE, or NAME i guess 
 * if lowering the amount, cannot be lower than what has already been allocated to ALL categories
 * if increasing the amount, cannot exceed the $100,000 cap limit
 * 
 * B.) Petition to change a categories AMOUNT, USER RESPONSIBLE or NAME i guess
 * if lowering the amount allocated, it CANNOT be lower than what the USER RESPONSIBLE has already SPENT
 * if increasing the amount allocated, it CANNOT be higher than the TOTAL AMOUNT LEFT TO ALLOCATE in the budget
 * if you are changing the USER RESPONSIBLE, ALL TRANSACTIONS related to the current 
 * USER RESPONSIBLE and category MUST BE CONFIRMED. IF THEY ARE NOT, you cannot petition to change the USER
 * 
 * C.) even though this is for every budget, also add (for each different group) the ability to PETITION TO CHANGE THE GROUP OWNER
 * GROUP OWNERS HAVE 1 DAY TO TRANFER OWNERSHIP TO THE NEW OWNER OR THEY WILL BE KICKED FROM THE GROUP
 *     
 *  if the user who is voted as the new one responsible rejects it
 *  the petition is VOID
 * 
 * once a petition has been submitted, ALL MEMBERS (and OWNER) HAVE 24 HOURs to VOTE
 * if a MEMBER does not VOTE, they are considered VOID
 * 
 * YAY OR NAY:
 * if a DECISION is 50/50, the PETITION WILL NOT PASS (users who submit the petition automatically vote "yay")
 * YAY > 50% PASS
 * NAY > 50% FAIL
 * 
 */

import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Dimensions, Text, TouchableOpacity, View } from "react-native";
import { useGroup } from "../../../../backend/globalState/groupContext";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../../../firebaseConfig";
import { ScrollView } from "react-native-gesture-handler";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";import { CreateCategoryPetitionButton } from "../../buttons/petitions/createCategoryPetition";
import { CreateBudgetPetitionButton } from "../../buttons/petitions/createEventPetition";
import { VoteButton } from "../../buttons/petitions/vote";
import { GetGroupNames } from "../../../../backend/fetchUsers";
import { ExecutePetition } from "../../../../backend/petitionFunctions/execute";
import { ExecuteBudgetPetition } from "../../../../backend/petitionFunctions/executeBudget";

interface PetitionBudget {
    id: string;
    type: string;
    eventBudgetId: string;
    groupId: string;
    expiresAt: { seconds: number };
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
interface User {
    userId: string,
    username: string,
}
interface PetitionCategory {
    id: string;
    type: string;
    expiresAt: { seconds: number };
    categoryId: string;
    categoryName: string;
    passed: boolean;
    description: string;
    yayVotes: Array<any>;
    nayVotes: Array<any>;
    proposedBy: User;
    proposedAmount?: number;
    proposedName?: string;
    proposedUserResponsible?: User;
}

export const PetitionPage = ({eventBudgetId}: any) => {
    const [loading, setLoading] = useState(false);
    //display group members if changing group leader or user responsible
    const [modalVisible, setModalVisible] = useState(false);
    const [groupSize, setGroupSize] = useState(null);
    const [budgetPetitions, setBudgetPetitions] = useState<PetitionBudget[]>([]);
    const [petitions, setPetitions] = useState<PetitionCategory[]>([]);
    const [finishedBudgetPetitions, setFinishedBudgetPetitions] = useState<PetitionBudget[]>([]);
    const [finishedCategoryPetitions, setFinishedCategoryPetitions] = useState<PetitionCategory[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
    // use ref is used for things that dont need to re render (like useState)
    // better for non UI change vars
    const timerRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
    const processedPetitions = useRef(new Set<String>)
    const user = auth.currentUser;
    const {group} = useGroup();
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));

    // to get the correct dimesions of user deivce
    useEffect(() => {
        if(!user){
            setLoading(false);
            return;
        }
        const handleDimensionsChange = ({ window }) => {
            setDimensions(window);
        };

        const subscription = Dimensions.addEventListener('change', handleDimensionsChange);
        return () => {
            subscription.remove();
        };
    }, [user]);

    useEffect(() => {
        if(!user){
            setLoading(false);
            return;
        }
        const getMembers = async() => {
            const groupMembers = await GetGroupNames(group.groupId);
            setGroupSize(groupMembers.length);
        }
        getMembers();
        
    }, [user]);

    // setup listener for petitions (still IP)
    useEffect(() => {
        if(!user){
            setLoading(false);
            return;
        }
        setLoading(true);
        // ref
        const petitionsRef = collection(db, "petitions");
        // cateogry petitions
        const categoryQ = query(
            petitionsRef,
            where("eventBudgetId", "==", eventBudgetId),
            where("isComplete", "==", false),
            where("type", "==", "Category")
        );
        // event budget petitions
        const eventQ = query(
            petitionsRef,
            where("eventBudgetId", "==", eventBudgetId),
            where("isComplete", "==", false),
            where("type", "==", "EventBudget")
        )
        //setup listener
        // listen for any changes to the specific petition for the event budget clicked
        // go through all docs
        const unsubscribeCategory = onSnapshot(
            categoryQ, (snap) => {
                const petitionData = snap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as PetitionCategory[];
                setPetitions(petitionData);
                setLoading(false);
            
            },
            (error) => {
                console.log("error listening to petition data ", error);
                setLoading(false);
            }
        );

        const unsubscribeEventBudget = onSnapshot(
            eventQ, (snap) => {
                const petitionEventData = snap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                })) as PetitionBudget[];
                setBudgetPetitions(petitionEventData);
                setLoading(false);
            },
            (error) => {
                console.log("error listening to budget petition data ", error);
                setLoading(false);
            }
        )
        return () => {
            unsubscribeCategory();
            unsubscribeEventBudget();
        }

    }, [eventBudgetId, user]);
    // for the main modal

    // setup listener for petitions (finished)
    useEffect(() => {
        if(!user){
            setLoading(false);
            return;
        }
        setLoading(true);
        // ref
        const petitionsRef = collection(db, "petitions");
        const q = query(
            petitionsRef,
            where("eventBudgetId", "==", eventBudgetId),
            where("isComplete", "==", true),
            where("type", "==", "Category")
        );
        //setup listener
        // listen for any changes to the specific petition for the event budget clicked
        // go through all docs
        const unsubscribeFinishedCategoryPetitions = onSnapshot(
            q, (snap) => {
                const petitionData = snap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as PetitionCategory[];
                setFinishedCategoryPetitions(petitionData);
                setLoading(false);
            
            },
            (error) => {
                console.log("error listening to petition data ", error);
                setLoading(false);
            }
        );

        const eventQ = query(
            petitionsRef,
            where("eventBudgetId", "==", eventBudgetId),
            where("isComplete", "==", true),
            where("type", "==", "EventBudget")
        );
        //setup listener
        // listen for any changes to the specific petition for the event budget clicked
        // go through all docs
        const unsubscribeFinishedEventPetitions = onSnapshot(
            eventQ, (snap) => {
                const petitionBudgetData = snap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as PetitionBudget[];
                setFinishedBudgetPetitions(petitionBudgetData);
                setLoading(false);
            
            },
            (error) => {
                console.log("error listening to petition data ", error);
                setLoading(false);
            }
        );
        return () => {
            unsubscribeFinishedEventPetitions();
            unsubscribeFinishedCategoryPetitions();
        }

    }, [eventBudgetId, user]);

    const toggleModal = () => {
        setModalVisible(!modalVisible);
    }

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];
        const allPetitions: (PetitionCategory | PetitionBudget)[] = [...petitions, ...budgetPetitions];
        // set the timer for every petition
        allPetitions.forEach((petition) => {
            const updateCountdown = () => {
                // get the current date and convert the expiry to ms
                const now = Date.now(); 
                const expiresAt = petition.expiresAt.seconds * 1000; 
                // time left until voting
                const remainingTime = expiresAt - now;
                // once time is over, send petition id to backend and handle the update accordingly
                if (remainingTime <= 0 || groupSize === (petition.nayVotes.length + petition.yayVotes.length)) {
                    if(!processedPetitions.current.has(petition.id)){
                        handleTimerEnd(petition);
                        processedPetitions.current.add(petition.id);
                    }
                    clearInterval(timerRefs.current[petition.id]);
                    // delete the timer and maybe the petition
                    delete timerRefs.current[petition.id];
                    return;
                }
                // convert to huors minutes seconds
                const hours = Math.floor(remainingTime / (1000 * 60 * 60));
                const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                
                setTimeRemaining((prev) => ({
                    ...prev,
                    [petition.id]: `${hours}h ${minutes}m ${seconds}s`,
                }));
            };

            
            updateCountdown();
            const timer = setInterval(updateCountdown, 1000); 
            // set the timer for each petittion
            timerRefs.current[petition.id] = timer;
            timers.push(timer);
        });
    
        // cleanup the timer
        return () => {
            timers.forEach((timer) => clearInterval(timer));
        };
        // re renderes on any change to petition data
    }, [petitions, budgetPetitions]);

     
    const handleTimerEnd = async(petition: PetitionCategory | PetitionBudget) => {
        // category id is in there its a category petition
        if('categoryId' in petition){
            const res = await ExecutePetition(petition, group.groupId, eventBudgetId);
            if(res === 'Fail' || res === 'Success'){
                // add to the finished
                finishedCategoryPetitions.push(petition);
            }
        }
        else{
            const res = await ExecuteBudgetPetition(petition, group.groupId);
            if(res === 'Fail' || res === 'Success'){
                // add to the finished
                finishedBudgetPetitions.push(petition);
            }
        }
    };

    return (
        <View>
            <TouchableOpacity onPress={toggleModal}>
                <Ionicons name='create-outline' size={40}/>
            </TouchableOpacity>
            <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={toggleModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, {
                        width: dimensions.width,
                        height: dimensions.height
                    },]}>
                        <ScrollView>
                            <View style={{paddingTop: 30}}>
                            <Ionicons onPress={toggleModal} name="close" size={35} />
                            </View>
                            {/** pass event budget id to create pettion button */}
                                <View>
                                <CreateCategoryPetitionButton
                                eventBudgetId={eventBudgetId}
                                />
                                </View>
                                <View style={{paddingTop: 15}}>
                                <CreateBudgetPetitionButton
                                eventBudgetId={eventBudgetId}
                                />
                                </View>
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>Active Petitions</Text>
                                {
                                    budgetPetitions.map((petition, index) => (
                                        <View key={index} style={styles.petitionCard}>
                                        <View style={styles.petitionHeader}>
                                            <Text style={styles.petitionUser}>
                                                {petition.proposedBy.username}
                                            </Text>
                                            <Text style={styles.timeRemaining}>
                                                {timeRemaining[petition.id] || "Voting Ends Soon"}
                                            </Text>
                                        </View>
                                        <Text style={styles.petitionUser}>
                                            Main Budget
                                        </Text>
                                        <View style={styles.petitionDetails}>
                                            {
                                                petition.proposedAmount ? (
                                                    <Text style={styles.petitionDetail}>New Allocated Amount: ${petition.proposedAmount}</Text>
                                                ) :
                                                petition.proposedName ? (
                                                    <Text style={styles.petitionDetail}>New Name: {petition.proposedName}</Text>
                                                ) : (
                                                    <Text style={styles.petitionDetail}>Nothing Proposed.</Text>
                                                )
                                            }
                                            <Text style={styles.petitionReason}>Reason: {petition.description}</Text>
                                        </View>
                                            <View style={styles.votingContainer}>
                                            <View style={styles.voteCountContainer}>
                                                <Text style={styles.voteCountYay}>
                                                    Yay: {petition.yayVotes.length}
                                                </Text>
                                                <Text style={styles.voteCountNay}>
                                                    Nay: {petition.nayVotes.length}
                                                </Text>
                                            </View>
                                            <VoteButton 
                                            petitionId={petition.id}
                                            />
                                            </View>
                                            </View>
                                    ))
                                }
                                {
                                    petitions.map((petition, index) => (
                                        <View key={index} style={styles.petitionCard}>
                                        <View style={styles.petitionHeader}>
                                            <Text style={styles.petitionUser}>
                                                {petition.proposedBy.username}
                                            </Text>
                                            
                                            <Text style={styles.timeRemaining}>
                                                {timeRemaining[petition.id] || "Voting Ends Soon"}
                                            </Text>
                                            </View>
                                            <Text style={styles.petitionUser}>
                                                {petition.categoryName}
                                            </Text>
                                            <View style={styles.petitionDetails}>
                                            {
                                                petition.proposedAmount ? (
                                                    <Text style={styles.petitionDetail}>New Allocated Amount: ${petition.proposedAmount}</Text>
                                                ) :
                                                petition.proposedName ? (
                                                    <Text style={styles.petitionDetail}>New Name: {petition.proposedName}</Text>
                                                ) : 
                                                petition.proposedUserResponsible ? (
                                                    <Text style={styles.petitionDetail}>New User Responsible: {petition.proposedUserResponsible.username}</Text>
                                                )
                                                : (<Text style={styles.petitionDetail}>Nothing Proposed.</Text>)
                                            }
                                            <Text style={styles.petitionReason}>Reason: {petition.description} </Text>
                                            </View>
                                            <View style={styles.votingContainer}>
                                            <View style={styles.voteCountContainer}>
                                            <Text style={styles.voteCountYay}>Yays: {petition.yayVotes.length}</Text>
                                            <Text style={styles.voteCountNay}>Nays: {petition.nayVotes.length}</Text> 
                                            </View>
                                            <VoteButton 
                                            petitionId={petition.id}
                                            />
                                            </View>
                                        </View>
                                    ))
                                }
                            </View>
                            <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Completed Petitions</Text>
                            {
                                finishedBudgetPetitions.map((petition, index) => (
                                    <View key={index} style={styles.petitionCard}>
                                    <View style={styles.petitionStatusContainer}>
                                    <Text style={[
                                        styles.petitionStatus, 
                                        petition.passed ? styles.petitionPassed : styles.petitionFailed
                                        ]}>
                                        {petition.passed ? 'Passed' : 'Failed'}
                                    </Text>
                                    </View>
                                        {/** get the time remaining for each petition */}
                                        <View style={styles.petitionDetails}>
                                        {
                                            petition.proposedAmount ? (
                                            <Text style={styles.petitionDetail}>New Planned Amount: ${petition.proposedAmount}</Text>
                                            ) :
                                            petition.proposedName ? (
                                                <Text style={styles.petitionDetail}>New Name: {petition.proposedName}</Text>
                                            ) : 
                                            (<Text style={styles.petitionDetail}>Nothing Proposed.</Text>)
                                        }
                                        <Text style={styles.petitionReason}>Reason: {petition.description} </Text>
                                        <View style={styles.votingContainer}>
                                            <View style={styles.voteCountContainer}>
                                            <Text style={styles.voteCountYay}>Yays: {petition.yayVotes.length}</Text>
                                            <Text style={styles.voteCountNay}>Nays: {petition.nayVotes.length}</Text> 
                                        </View>
                                        </View>
                                        </View>
                                    </View>
                                    ))
                                }
                                {
                                    finishedCategoryPetitions.map((petition, index) => (
                                        <View key={index} style={styles.petitionCard}>
                                        <View style={styles.petitionStatusContainer}>
                                        <Text style={[
                                        styles.petitionStatus, 
                                        petition.passed ? styles.petitionPassed : styles.petitionFailed
                                        ]}>
                                        {petition.passed ? 'Passed' : 'Failed'}
                                        </Text>
                                        </View>
                                            {/** get the time remaining for each petition */}
                                            <View style={styles.petitionDetails}>
                                            {
                                                petition.proposedAmount ? (
                                                    <Text style={styles.petitionDetail}>New Allocated Amount: ${petition.proposedAmount}</Text>
                                                ) :
                                                petition.proposedName ? (
                                                    <Text style={styles.petitionDetail}>New Name: {petition.proposedName}</Text>
                                                ) : 
                                                petition.proposedUserResponsible ? (
                                                    <Text style={styles.petitionDetail}>New User Responsible: {petition.proposedUserResponsible.username}</Text>
                                                )
                                                : (<Text style={styles.petitionDetail}>Nothing Proposed.</Text>)
                                            }
                                            <Text style={styles.petitionReason}>Reason: {petition.description} </Text>
                                            <View style={styles.votingContainer}>
                                            <View style={styles.voteCountContainer}>
                                            <Text style={styles.voteCountYay}>Yays: {petition.yayVotes.length}</Text>
                                            <Text style={styles.voteCountNay}>Nays: {petition.nayVotes.length}</Text> 
                                            </View>
                                        </View>
                                        </View>
                                    </View>
                                    ))
                                }
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    petitionStatusContainer: {
        flexDirection: 'row'
    },
    petitionStatus: {
        fontSize: 18,
        paddingBottom: 10,
    },
    petitionPassed:{ 
        color:'green'
    },
    petitionFailed: {
        color: 'red'
    },
    petitionModalOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#003f7f',
    },
    petitionModalView: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003f7f',
        alignSelf: 'center',
        paddingTop: 20,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    petitionCard: {
        backgroundColor: '#f4f4f4',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        marginHorizontal: 10,
    },
    petitionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    petitionUser: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003f7f',
    },
    timeRemaining: {
        fontSize: 14,
        color: '#007bff',
    },
    petitionDetails: {
        marginBottom: 10,
    },
    petitionDetail: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    petitionReason: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
    },
    votingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voteCountContainer: {
        flexDirection: 'row',
    },
    voteCountYay: {
        color: '#28a745',
        marginRight: 15,
    },
    voteCountNay: {
        color: '#dc3545',
    },
})