import React, { useState } from "react";
import { StyleSheet, Platform, TouchableOpacity, TextInput, View, Text,Pressable, Modal, Alert, Button } from "react-native";
import { CreateRecurring } from "../../../../backend/budgetFunctions/recurringBudget/createRecurring";
import { useGroup } from "../../../../backend/globalState/groupContext";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

interface RecurringBudget {
  name: string,
  description: string,
  frequency: string
  plannedAmount: string,
  remainingAmount: number,
  spentAmount: number,
  numberOfCategories: 0,
  enableCategories: boolean,
  categories: [],
}

const frequencies = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'BiWeekly', value: 'biweekly'},
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' }
];

export const CreateRecurringBudgetButton = () => {
  const {group} = useGroup();
  const [modalPage, setModalPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [recurringBudget, setRecurringBudget] = useState<RecurringBudget>({
    name: "",
    description: "",
    frequency: "",
    plannedAmount: "",
    remainingAmount: 0,
    spentAmount: 0,
    numberOfCategories: 0,
    enableCategories: false,
    categories: [],
  });

  const toggleModal = () => {
    setModalVisible(!modalVisible);
    setRecurringBudget({
      name: "",
      description: "",
      frequency: "",
      plannedAmount: "",
      remainingAmount: 0,
      spentAmount: 0,
      numberOfCategories: 0,
      enableCategories: false,
      categories: [],
    });
  }

  const handleButtonClick = async() => {
    if(!group){
      throw Alert.alert("Error, must be in a group to create reccuring budget.")
    }
    if(!recurringBudget.name || !recurringBudget.plannedAmount || !recurringBudget.frequency){
      throw Alert.alert("Error, must fill all requires fields.")
    }
    const updatedBudget = {
      ...recurringBudget,
      plannedAmount: parseFloat(recurringBudget.plannedAmount)
    };

    toggleModal();
    // create recurring bugdet call backend
    await CreateRecurring(updatedBudget, group.groupId)
    // reset all the prev information in modal
    resetForm();
  }

  const resetForm = () => {
    setRecurringBudget({
      name: "",
      description: "",
      frequency: "",
      plannedAmount: "",
      remainingAmount: 0,
      spentAmount: 0,
      numberOfCategories: 0,
      enableCategories: false,
      categories: [],
    });
  }

  const renderModalContent = () => {
    switch(modalPage){
      // input name and description
      case 1:
        return(
          <View style={styles.container}>
            <Text style={styles.header}>Create a name:</Text>
            <View>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={'gray'}
            value={recurringBudget.name}
            onChangeText={(text) => setRecurringBudget({...recurringBudget, name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            placeholderTextColor={'gray'}
            value={recurringBudget.description}
            onChangeText={(text) => setRecurringBudget({...recurringBudget, description: text})}
          />
            </View>
              <View style={styles.buttonContainer}>
              <Pressable style={styles.cancelButton} onPress={toggleModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.nextButton, recurringBudget.name.length > 0 ? styles.nextButton : styles.disabledButton ]}
                onPress={() => recurringBudget.name.length > 0 && setModalPage(2)}
                disabled={recurringBudget.name.length === 0}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        );
      // input amount
      case 2:
        return(
          <View style={styles.container}>
            <Text style={styles.header}>How much do you plan on spending?</Text>
            <TextInput
              style={styles.input}
              placeholder="Budget Amount"
              placeholderTextColor={'gray'}
              keyboardType="numeric"
              value={recurringBudget.plannedAmount}
              onChangeText={(text) => {
                const amount = parseFloat(text);
                if (amount > 100000){
                  Alert.alert("Budgets cannot exceed $100,000");
                  return;
                }
                setRecurringBudget({...recurringBudget, plannedAmount: text});
              }}
              />

            <View style={styles.buttonContainer}>
              <Pressable style={styles.nextButton} onPress={() => setModalPage(1)}>
                <Ionicons name="arrow-back" size={20} color="white" />
              </Pressable>
              <Pressable 
                style={[styles.nextButton, parseFloat(recurringBudget.plannedAmount) > 0 ? styles.nextButton : styles.disabledButton ]}
                onPress={() => parseFloat(recurringBudget.plannedAmount) > 0 && setModalPage(3)}
                disabled={parseFloat(recurringBudget.plannedAmount) === 0}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        );
      // input frequency and if you wanna enable categories
      case 3:
        return(
          <View style={styles.container}>
            <Text style={styles.header}>Set Frequency</Text>
            <View style={styles.frequencyContainer}>
              {frequencies.map((frequency) => (
                <TouchableOpacity
                  key={frequency.value}
                  style={[
                    styles.frequencyButton,
                    recurringBudget.frequency === frequency.value && styles.selectedFrequency
                  ]}
                  onPress={() => setRecurringBudget({...recurringBudget, frequency: frequency.value})}>
                  <Text style={[
                    styles.frequencyText,
                    recurringBudget.frequency === frequency.value && styles.selectedFrequencyText
                  ]}>
                    {frequency.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
      
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => setRecurringBudget({
                ...recurringBudget,
                enableCategories: !recurringBudget.enableCategories
              })}
            >
              <View style={styles.settingRow}>
                <Text style={styles.settingText}>Enable Categories</Text>
                <View style={[
                  styles.checkbox,
                  recurringBudget.enableCategories && styles.checkboxChecked
                ]} />
              </View>
            </TouchableOpacity>
      
            <View style={styles.buttonContainer}>
                    <Pressable style={styles.nextButton} onPress={() => setModalPage(2)}>
                        <Ionicons name="arrow-back" size={20} color="white" />
                    </Pressable>
                    <Pressable 
                        style={styles.submitButton}
                        onPress={handleButtonClick}
                    >
                        <Text style={styles.submitButtonText}>Create Budget</Text>
                    </Pressable>
                </View>
          </View>
        );
  }
  };


return (
  <ScrollView>
    <TouchableOpacity
    style={styles.createRecurringBudgetButton}
    onPress={(() => toggleModal())}>
      <Text style={styles. createRecurringBudgetButtonText}>Create Recurring Budget+</Text>
    </TouchableOpacity>

    <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={toggleModal}
    >
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        {renderModalContent()}
      </View>
    </View>
    </Modal>
  </ScrollView>
);
}

const styles = StyleSheet.create({
  centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    overflow: 'hidden', 
},
container: {
    width: '100%',
    justifyContent: 'space-between', 
    alignItems: 'center',
},
 header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color:'#003f7f'
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
},
  input: {
      height: 40,
      width: 250,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 10,
      paddingHorizontal: 10,
      borderRadius: 5,
      alignSelf: 'center'
  },
  createRecurringBudgetButton: {
    flex: 3,
    backgroundColor: '#003f7f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  createRecurringBudgetButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
      textAlign: 'center',
  },
  frequencyContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  frequencyButton: {
    width: '48%',
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    alignItems: 'center'
  },
  selectedFrequency: {
      backgroundColor: '#003f7f',
  },
  frequencyText: {
      fontSize: 16,
      textAlign: 'center',
  },
  selectedFrequencyText: {
      color: 'white',
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
  submitButton: {
    backgroundColor: '#003f7f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  submitButtonText: {
      color: 'white',
      fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#d9534f',
    padding: 12,
    borderRadius: 25,
  },
  cancelButtonText: {
      color: 'white',
      fontSize: 16,
  },
  settingButton: {
      width: '100%',
      padding: 15,
      borderRadius: 5,
      backgroundColor: '#f0f0f0',
      marginBottom: 10,
  },
  settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  settingText: {
      fontSize: 16,
  },
  checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#003f7f',
  },
  checkboxChecked: {
      backgroundColor: '#003f7f',
  },
  frequencyGrid: {
    width: '50%',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});