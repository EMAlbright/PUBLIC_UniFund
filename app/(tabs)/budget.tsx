import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useGroup } from '../../backend/globalState/groupContext';
import { BudgetPageToolbar } from '../../components/budgetPage/budgetToolbar/budgetingToolbar';
export default function Budget() {

  const {group} = useGroup();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRight} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerText}>
            {group ? group.groupName : "No group"}
          </Text>
        </View>
        <View style={styles.headerLeft} />
      </View>
      <BudgetPageToolbar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007bff',
  },
  header: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  
})
