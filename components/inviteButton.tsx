import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { inviteUser } from "../backend/inviteUser";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useGroup } from "../backend/globalState/groupContext";
import { useEffect, useState } from "react";

interface InviteButtonProps {
    userid: string;
}

interface GroupMember {
    userId: string;
    username: string;
}

export const InviteButton = ({ userid }: InviteButtonProps) => {
        // fix this ui
    // one lsitener for invited users, if the user is already in the group
    // i.e., if current group id is equal to the invited users invitedGroups collection
    // groupId, display "invited"
    // another for the invited user being a member, setup a listener for the groups members
    // if invited userId is equal to one, display "already in group"
    const user = auth.currentUser;
    const {group} = useGroup();
    const [loading, setLoading] = useState(true);
    const [buttonState, setButtonState] = useState('default'); 
    useEffect(() => {
        if(!group){
            return;
        }
        const groupRef = doc(db, "groups", group.groupId);
        // listener for group

        const unsubscribe = onSnapshot(groupRef, (doc) => {
            const groupData = doc.data();
            if(groupData){
                if (groupData.invitedMembers && groupData.invitedMembers.includes(userid)) {
                    setButtonState('invited');
                } 
                else if (groupData.members && groupData.members.some((member: GroupMember) => member.userId === userid)) {
                    setButtonState('member');
                } else{
                    setButtonState('default');
                }
            }
            setLoading(false);
        })
        return () => unsubscribe();
    }, [group, userid])

    if(!group){
        return (<Text>No group selected</Text>);
    }
    if(loading){
        return (<Text style={{fontStyle: 'italic'}}>Loading...</Text>);
    }
    const handleInvite = async() => {
        if(user && group){
            const userDocRef = doc(db, 'users', user.uid);
            const profile = await getDoc(userDocRef);
            const profileData =profile.data(); 

            //we pass in our own username so the invited user can see who invited them
            await inviteUser(userid, group.groupId, profileData.profile.username);
        }
        else{
            throw new Error('must have a group selected');
        }
    }
    // state of the button returned
    const getButtonContent = () => {
        switch (buttonState) {
            case 'invited':
                return 'Invited';
            case 'member':
                return 'Member';
            default:
                return 'Invite';
        }
    };

    return(
        <TouchableOpacity 
            style={[
                styles.button,
                buttonState !== 'default' && styles.disabledButton
            ]}
            onPress={handleInvite}
            disabled={buttonState !== 'default'}
        >
            <Text style={styles.buttonText}>{getButtonContent()}</Text>
        </TouchableOpacity>
    )
}
const styles = StyleSheet.create({
    button: {
        backgroundColor: '#003f7f',
        padding: 8,
        borderRadius: 4,
        minWidth: 70,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#666',
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
    }
});

