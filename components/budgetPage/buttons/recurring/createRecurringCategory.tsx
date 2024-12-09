import { TouchableOpacity, Text, View, Modal, Dimensions, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from "react-native"
import { useGroup } from "../../../../backend/globalState/groupContext"
import { GetGroupNames } from "../../../../backend/fetchUsers";
import Slider from '@react-native-community/slider';
import { useState } from "react";
import { CreateRecurringCategory } from "../../../../backend/budgetFunctions/recurringBudget/createRecurringCategory";
import { GetRemainingRecurringAmount } from "../../../../backend/budgetFunctions/recurringBudget/fetchRemainingRecurring";

/**
 * Takes in a recurring budget doc ID
 * @param RecurringBudgetId
 * @param GroupId
 * Creates the button which will call
 * createrecurringBudgetCategory
 * Need the group id in order to pass it to find user to get all the usernames of groups members
 * 
 * 
 *  [
 *   {
 *     categoryName: "Drinks",
 *     allocatedAmount: 50,
 *     responsibleUser: "User_ID"
 *   }
 * ]
 * 
 * Once responsibleUser creates an EXPENSE, another field will be added as spentAmount
 */

interface UserResponsible {
    userId: string,
    username: string
}

interface RecurringCategory {
    categoryName: string;
    allocatedAmount: number;
    userIdResponsible: string;
    usernameResponsible: string;
    recurringBudgetId: string;
    spentAmount?: number;
    groupId: string;
  }

export const CreateRecurringCategoryButton = ({recurringBudgetId}) => {
    const [members, setMembers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [amount, setAmount] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);
    const [name, setName] = useState("");
    const [userResponsible, setUserResponsible] = useState<UserResponsible>();
    const [loading, setLoading] = useState(false);

    const {group} = useGroup();
    
      //toggle for modal
    const toggleModal = () => {
        setModalVisible(!modalVisible);
    };

    // get the remaining amount the recurring budge id has


    const onPressPlus = async() => {
        try{
            setLoading(true);
            const remainingAmount = await GetRemainingRecurringAmount(group.groupId, recurringBudgetId);
            setRemainingAmount(remainingAmount);
            const groupMembers = await GetGroupNames(group.groupId);
            setMembers(groupMembers);
        }
        catch(error){
            console.log(error);
        }
        finally{
            setLoading(false);
        }
        toggleModal();
    }

    // call find user in order to display the names of all the users in the group

    const handleSubmit = async() => {
        // call backend func, pass in recurring budget id
        // this is called on the submition of all values (recurringBudgetId, categoryName, user responsible, allocated amount)
        if(!name || !amount || !userResponsible){
            throw new Alert.alert("Please fill all fields.");
        }
        else{
            const categoryData: RecurringCategory = {
                categoryName: name,
                allocatedAmount: amount,
                userIdResponsible: userResponsible.userId,
                usernameResponsible: userResponsible.username,
                recurringBudgetId: recurringBudgetId,
                groupId: group.groupId,
                spentAmount: 0
            };
            
            toggleModal();
            await CreateRecurringCategory(categoryData);
            // reset form
            setName("");
            setAmount(0);
            setUserResponsible(undefined);
        }
    }

    if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        );
      }

    return (
        <View>
            {/** just the initialize + add cateogry button */}
        <TouchableOpacity onPress={onPressPlus}>
            <View style={styles.circle}>
                <Text style={styles.categoryText}>+</Text>
            </View>
        </TouchableOpacity>
        {/** all this has will be adding a category, when you click the category count you can view all */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={toggleModal}
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
                <Text style={styles.modalHeader}>Allocate Budget</Text>
                <Text style={{color: 'green', fontWeight: 'bold', fontSize: 18, paddingBottom: 10}}>Amount Remaining: ${remainingAmount}</Text>
                {/** name for the category */}
                <TextInput
                placeholder="Category Name"
                placeholderTextColor={'gray'}
                value={name}
                onChangeText={setName}
                style={styles.input}
                />
            
                {/** amount to allocate (cant exceed planned amount) */}
                <Text style={{fontWeight: 'bold', paddingBottom: 10}}>${amount}</Text>
                <Slider
                style={{width: Dimensions.get('window').width * 0.7, height: 40}}
                minimumValue={1}
                maximumValue={remainingAmount}
                value={amount}
                onValueChange={(newAmount) => setAmount(newAmount)}
                step={1}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#DEDEDE"
                thumbTintColor="#007AFF"
                />
                
                {/** user responsible for this category not a text input*/}
                <Text> Select the user responsible: </Text>
                {members.map((member, index) => (
                    <TouchableOpacity key={index} onPress={() => setUserResponsible(member)}>
                        <Text
                        style={{fontWeight: member === userResponsible ? 'bold' : 'normal', paddingBottom: 5, paddingTop: 5}}>{member.username}</Text>
                    </TouchableOpacity>
                ))}
                
                <View style={styles.buttonContainer}>
                    <Pressable style={styles.cancelButton} onPress={toggleModal}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </Pressable>
            </View>
            </View>
         </View>
      </Modal>
    </View>
    )
} 

const styles = StyleSheet.create({
    categoryText: {
        fontWeight: 'bold',
        fontSize: 30,
        color: 'white',
    },
    circle: {
        width: 50,
        height: 50,
        borderRadius: 25, 
        backgroundColor: '#007bff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 250
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
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        fontWeight: 'bold',
        fontSize: 18,
        paddingBottom: 18,
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: 'black',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
      },
      slider:{
      },
      usernames:{
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    submitButton:{
        backgroundColor: '#003f7f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginLeft: 15,
        alignItems: 'center',
        flex: 1,
    },
    submitButtonText:{
        color: '#fff',
        fontSize: 16,
    },
    cancelButton:{
        backgroundColor: '#d9534f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginRight: 15,
        alignItems: 'center',
        flex: 1,
    },
    cancelButtonText:{
        color: '#fff',
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },

})