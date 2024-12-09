import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, Pressable, TouchableOpacity, View, Dimensions } from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { ScrollView } from "react-native-gesture-handler";
import { GetGroupDetails } from "../backend/fetchGroupDetails";
import { TransferOwnershipButton } from "./transferOwnership";

interface User {
    userId: string;
    username: string;
}

interface GroupData {
    members: User[];
    description: string;
}

interface GroupDetailProps {
    groupId: string;
}

export const ViewGroupDetails = ({groupId}: GroupDetailProps) => {
    const [loading, setLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const user = auth.currentUser;
    const currUserId = user?.uid;

    useEffect(() => {
        if (!modalVisible || !user){
            setLoading(false);
            return;
        } 

        const userRef = doc(db, 'users', currUserId);
        
        const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const groups = userData.groups || [];
                const group = groups.find((g: { groupId: string; isOwner: boolean }) => 
                    g.groupId === groupId
                );
                setIsOwner(group?.isOwner ?? false);
            }
        });

        // cleanup listener
        return () => unsubscribe();
    }, [modalVisible, user, groupId]);

    const toggleModal = () => {
        setModalVisible(!modalVisible);
    } 
    const fetchGroupData = async () => {
        try {
            setLoading(true);
            const data = await GetGroupDetails(groupId);
            setGroupData(data);
        } catch (err) {
            console.log('Error fetching group details:', err);
        } finally {
            setLoading(false);
        }
        toggleModal();
    };

    if (loading) {
        return <ActivityIndicator />;
      }

    // when we loop through members we can pass member.id as the prop to transfer ownership
    return (
        <View>
            <TouchableOpacity onPress={fetchGroupData}>
                <Text>See Details...</Text>
            </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={toggleModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Group Details</Text>
                    </View>

                <ScrollView style={styles.modalContent}>   
                {groupData && (
                <View>
                    <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {groupData.description || 'No description available'}
                    </Text>
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>
                            Members ({groupData.members.length})
                    </Text>
                    {groupData.members.length === 1 && (
                        <Text>No other members.</Text>
                    )}
                    {groupData.members.map((member, index) => (
                        <View key={index} style={styles.memberRow}>
                            {
                            member.userId !== currUserId && (
                                <Text style={styles.memberName}>{member.username}</Text>
                            )
                            }
                        {
                        isOwner && groupData.members.length > 1 && member.userId !== currUserId && (
                            <TransferOwnershipButton
                            groupId={groupId}
                            newOwner={member}
                            />
                        )
                        }
                        </View>
                    ))}
                </View>
                </View>
            )}
                <Pressable style={styles.closeButton} onPress={toggleModal}>
                    <Text style={styles.closeButtonText}>Cancel</Text>
                </Pressable>
            </ScrollView>
            </View>
            </View>
        </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    closeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '75%'
      },
      modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    
    closeButton: {
        alignSelf: 'center',
        backgroundColor: '#d9534f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 35
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',

    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',

    },
    modalContent: {
        padding: 20,

    },
    sectionContainer: {
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 16,
        color: '#666',
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    memberName: {
        fontSize: 16,
        color: '#333',
    },
})