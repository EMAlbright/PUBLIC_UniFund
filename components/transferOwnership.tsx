import { View, Text, Alert, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { TouchableOpacity } from "react-native";
import { UpdateGroupOwner } from "../backend/groupFunctions/transferGroupOwner";

interface User {
    userId: string;
    username: string;
}
interface TransferOwnershipProps {
    groupId: string;
    newOwner: User;
}

export const TransferOwnershipButton = ({groupId, newOwner}: TransferOwnershipProps) => {
    const currUserId = auth.currentUser?.uid;

    const handleSubmit = async() => {
        Alert.alert(
            "Transferring Ownership",
            `${newOwner.username} will be the new owner of this group. Are you sure?`,
            [   // cancel button
                {
                    text: "Cancel",
                    style: "destructive"
                },
                // confirme deletion onpress call delete group
                {
                    text: "Confirm",
                    style: "default",
                    onPress: async () => {
                        try{
                            const response = await UpdateGroupOwner(currUserId, newOwner.userId, groupId);
                            if(response === "Success!"){
                                return Alert.alert("Ownership Transferred!");
                            }
                            else{
                                return Alert.alert("Error Transferring Ownership!");
                            }
                        } catch(error){
                            Alert.alert(error);
                        }
                    }
                }
            ]
        )
    }

    return(
            <TouchableOpacity onPress={handleSubmit}>
                <Text style={styles.button}> Transfer Ownership</Text>
            </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#003f7f',
        color: 'white',
        marginLeft: 50,
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 5
    }
})