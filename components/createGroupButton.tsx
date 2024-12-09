import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Modal, Pressable, Alert } from "react-native";
import { createGroup } from "../backend/groupFunctions/creategroup";

/**
 * 
 * @returns 
 * 
 * UI  for the create group button
 */

export default function CreateGroupButton() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  //toggle for modal
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const onCreateGroupClick = async () => {
    // group name and description required
    if (groupName && groupDescription) {
      toggleModal();
      await createGroup(groupName, groupDescription);
      setGroupName('');
      setGroupDescription('');
    } else {
      throw new Alert.alert("Group name and description are required");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={toggleModal}>
        <Text style={styles.buttonText}>Create a Group +</Text>
      </TouchableOpacity>

      {/** modal pop up for the create group */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create a New Group</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Group Description"
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholderTextColor="#999"
            />

            <View style={styles.buttonContainer}>
              <Pressable style={styles.cancelButton} onPress={toggleModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitButton} onPress={onCreateGroupClick}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '50%',
    marginBottom: 20,
    padding: 16,
  },
  button: {
    backgroundColor: '#003f7f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '75%'
  },
  submitButton: {
    backgroundColor: '#003f7f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 15,
    flex: 1,
    
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
