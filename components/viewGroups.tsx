/**
 * @returns void, displays the groups the user is in
 * EDIT:
 * Now to add functionality of global state with each group
 * a user has, add a selected GROUP to this file so user
 * can view their groups, and choose which one they want
 */
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useGroup } from "../backend/globalState/groupContext";
import { DeleteGroupButton } from "./budgetPage/buttons/deleteGroup";
import { ViewGroupDetails } from "./viewGroupDetails";

export const ViewGroups = () => {

    const { group, setGroup } = useGroup();
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            setUserGroups([]);
            setLoading(false); 
            return;
        }   
        // get user ref
        const userDocRef = doc(db, "users", user.uid);

        // add a listener so when a group is added we automatically display it
        // firestore real time synch

        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const groups = userData.groups || [];
                // set the groups to the group names
                // for each element in array, get the groupName
                const groupsWithRoles = groups.map(group => ({
                    ...group,
                    role: group.isOwner ? 'Owner' : 'Member'
                }));
                setUserGroups(groupsWithRoles);
            } else {
                setUserGroups([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user's groups: ", error);
            setLoading(false);
        });

        // Cleanup function to unsubscribe when component unmounts
        return () => unsubscribe();
    }, [user]);

    const handleGroupSelect = (selectedGroup) => {
        setGroup(selectedGroup);
      };
    
    // set the new user group
    const renderGroupItem = ({ item }) => (
        <TouchableOpacity
        onPress={() => handleGroupSelect(item)}>
        <View style={[styles.groupItem, group ? item.groupId === group.groupId && styles.selectedGroupItem : styles.groupItem]}>
            <View style={styles.groupInfoContainer}>
                <Text style={{color: 'gray', fontStyle: 'italic'}}>{item.role}</Text>
                <Text style={[styles.groupText, group ? item.groupId === group.groupId && styles.selectedGroupText : styles.groupText]}>{item.groupName}</Text>
            <View style={styles.groupDetails}>
            <ViewGroupDetails
            groupId={item.groupId}
            />
            </View>
            </View>
            <DeleteGroupButton
            groupId={item.groupId}
            // we need onDelete so the user is still not set in the group
            // if they delete a group while in that group state
            onDelete={() => {
                if(group && group.groupId === item.groupId){
                    setGroup(null);
                }
            }}
            />
        </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Groups</Text>
            </View>
            {/* list each group user is in, in a FlatList, otherwise display they are not in a group*/}
            {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
            ) : userGroups.length > 0 ? (
                <FlatList
                    data={userGroups}
                    renderItem={renderGroupItem}
                    keyExtractor={(item) => item.groupId}
                />
            ) : (
                <Text style={styles.noGroupsText}>You're not in any groups yet.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'white',
        alignSelf: 'center',
        borderRadius: 16,
        borderColor: 'white',
        
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    loadingText: {
        fontStyle: 'italic',
    },
    noGroupsText: {
        fontStyle: 'italic',
        color: '#666',
    },
    groupDetails: {
        paddingTop: 12
    },
    groupInfoContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    selectedGroupItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        borderColor: 'black',
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    groupItem: {
        backgroundColor: '#003f7f',
        padding: 15,
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedGroupText: {
        fontSize: 16,
        color: '#003f7f',
        fontWeight: 'bold',
    },
    groupText: {
        fontSize: 16,
        color: 'white'
    },
});