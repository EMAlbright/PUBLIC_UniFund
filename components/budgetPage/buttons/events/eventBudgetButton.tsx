import React, { useState } from "react";
import { StyleSheet, Platform, TouchableOpacity, ScrollView, TextInput, View, Text,Pressable, Modal, Alert } from "react-native";
import { CreateEventBudget } from "../../../../backend/budgetFunctions/eventBudget/createEventBudget";
import { useGroup } from "../../../../backend/globalState/groupContext";
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

export const CreateEventBudgetButton = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalPage, setModalPage] = useState(1);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [deadline, setDeadline] = useState("");
    const [date, setDate] = useState(new Date());
    const { group } = useGroup();

    const toggleModal = () => {
      //reset form and visibility
      resetForm();
      setModalVisible(!modalVisible);
    }

    const toggleDatePicker = () => {
        setShowPicker(!showPicker);
      };
    
      const onChange = ({type}, selectedDate) => {
        if(type == "set"){
          const currentDate = selectedDate;
          setDate(currentDate);
    
          if(Platform.OS === "android"){
            toggleDatePicker();
            setDeadline(currentDate.toDateString());
          }
        }
        else{
          toggleDatePicker();
        }
      }
    
      const confirmIOSDate = () => {
        setDeadline(date.toDateString());
        toggleDatePicker();
      }

    const handleButtonClick = async () => {
      if(!deadline){
        throw new Alert.alert("Please set a deadline.");
      }
      else{
        setModalVisible(false);
        await CreateEventBudget(name, description, parseFloat(amount), deadline, group.groupId, 0);
        resetForm();
      }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        // reset date to today
        setDate(new Date());
        setAmount("");
    };

    const renderModalContent = () => {
      switch(modalPage){
        // name and description
        case 1:
          return(
            <View style={styles.container}>
              <Text style={styles.header}>Create a name:</Text>
              <View>
                <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={'gray'}
                value={name}
                onChangeText={(text) => setName(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                placeholderTextColor={'gray'}
                value={description}
                onChangeText={(text) => setDescription(text)}
              />
              </View>
              <View style={styles.buttonContainer}>
              <Pressable style={styles.cancelButton} onPress={toggleModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.nextButton, name.length > 0 ? styles.nextButton : styles.disabledButton ]}
                onPress={() => name.length > 0 && setModalPage(2)}
                disabled={name.length === 0}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
              </Pressable>
            </View>
            </View>

          );

        // amount
        case 2:
          return(
            <View style={styles.container}>
              <Text style={styles.header}>How much do you plan on spending?</Text>
              <TextInput
              style={styles.input}
              placeholder="Budget Amount"
              placeholderTextColor={'gray'}
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => {
                const inputAmount = parseFloat(text);
                if (inputAmount > 100000){
                  Alert.alert("Budgets cannot exceed $100,000");
                  return;
                }
                setAmount(text);
              }}
              />
              <View style={styles.buttonContainer}>
              <Pressable style={styles.nextButton} onPress={() => setModalPage(1)}>
                <Ionicons name="arrow-back" size={20} color="white" />
              </Pressable>
              <Pressable 
                style={[styles.nextButton, parseFloat(amount) > 0 ? styles.nextButton : styles.disabledButton ]}
                onPress={() => parseFloat(amount) > 0 && setModalPage(3)}
                disabled={parseFloat(amount) === 0}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
              </Pressable>
            </View>
            </View>
          );

        // deadline
        case 3:
          return(
            <View style={styles.container}>
              <Text style={styles.header}>Set a deadline for this budget:</Text>
              {showPicker && (
              <DateTimePicker
              style={styles.datepicker}
              mode="date"
              display="spinner"
              value={date}
              onChange={onChange}
              textColor="black"
              />
              )}
              {showPicker && Platform.OS === "ios" && (
              <View
                style={{flexDirection: "row",
                justifyContent: 'space-around'
                }}>
              <TouchableOpacity onPress={toggleDatePicker}>
                <Text style={{paddingHorizontal: 50, paddingBottom: 25, fontSize: 16, color:'red'}}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmIOSDate}>
                <Text style={{paddingHorizontal: 50, paddingBottom: 25, fontSize: 16, color:'#003f7f'}}>Confirm</Text>
              </TouchableOpacity>
              </View>
              )}
              {!showPicker && (
              <Pressable
              onPress={toggleDatePicker}>
              <TextInput
                style={styles.input}
                placeholder="Budget Deadline"
                value={deadline}
                placeholderTextColor={'gray'}
                onChangeText={setDeadline}
                editable={false}
                onPressIn={toggleDatePicker}
              />
              </Pressable>
              )}  
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
    }
    return (
      <ScrollView>
      <TouchableOpacity
      style={styles.createEventBudgetButton}
      onPress={(() => toggleModal())}>
        <Text style={styles.createEventBudgetButtonText}>Create Event Budget+</Text>
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
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'space-between', 
    alignItems: 'center',
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        width: '100%',
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    datepicker: {
        borderBlockColor: 'black'
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
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
        width: 200,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    createEventBudgetButton: {
        backgroundColor: '#003f7f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 10,
    },
    createEventBudgetButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
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
});