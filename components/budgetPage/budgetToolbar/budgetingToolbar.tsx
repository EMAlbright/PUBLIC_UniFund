import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import EventBudgetPage from '../pages/eventBudgetpage';
import ExpensePage from '../pages/expensepage';
import { useGroup } from '../../../backend/globalState/groupContext';
import { RecurringBudgetPage } from '../pages/recurringBudgetpage';

// if we did not have as const, ts would infer each
// type is a string, but we want the string literal
const TOOLBARTABS = {
    EVENT_BUDGETS: 'Event Budgets',
    EXPENSES: 'Expenses',
    RECURRING_BUDGETS: 'Recurring Budgets'
} as const;

type TabName = typeof TOOLBARTABS[keyof typeof TOOLBARTABS];

const EventBudget = () => <EventBudgetPage />;
const Expense = () => <ExpensePage />;
const RecurringBudget = () => <RecurringBudgetPage />;

export const BudgetPageToolbar = () => {
  const [selectedTab, setSelectedTab] = useState<TabName>(TOOLBARTABS.EVENT_BUDGETS);
  const {group} = useGroup();
  //use lazy loading
  //similat to async operation, memoizing makes it so
  // we cache unchanged data

    const TabContent = useMemo(() => ({
        [TOOLBARTABS.EVENT_BUDGETS]: EventBudget,
        [TOOLBARTABS.EXPENSES]: Expense,
        [TOOLBARTABS.RECURRING_BUDGETS]: RecurringBudget
    }), []);

    const handlePress = (tabName: TabName) => {
        setSelectedTab(tabName);
    }

    const TabButton = ({ name }: { name: TabName }) => (
        <TouchableOpacity
          style={[
            styles.toolbarButton,
            selectedTab === name && styles.selectedButton,
          ]}
          onPress={() => handlePress(name)}
        >
          <Text style={[
            styles.toolbarText,
            selectedTab === name && styles.selectedText,
          ]}>{name}</Text>
        </TouchableOpacity>
      );

    const SelectedContent = TabContent[selectedTab];
    
    if (!group) {
      return (
        <View>
          <Text style={styles.noGroupMessage}>Please Create or Join a Group</Text>
          <Text  style={styles.noGroupFooter}>Once You Create a Group, Click The Name To Navigate Around.</Text>
        </View>
      )
    }

    return (
      <View style={styles.toolbarContainer}>
          <View style={styles.toolbarWrapper}>
              <View style={styles.toolbar}>
                  {Object.values(TOOLBARTABS).map((tabName) => (
                      <TabButton key={tabName} name={tabName} />
                  ))}
              </View>
          </View>
          <View style={styles.contentContainer}>
              <SelectedContent />
          </View>
      </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    flex: 1,
    width: '100%',
},
toolbarWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
},
toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 10,
},
contentContainer: {
    flex: 1,
    width: '100%',
},
  noGroupMessage: {
    color: 'black',
    fontWeight: 'bold',
    paddingTop: 300,
    textAlign: 'center',
    justifyContent: 'center',
    alignContent: 'center'
  },
  noGroupFooter: {
    fontSize: 12,
    color: 'black',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center', 
    alignSelf: 'center',
  },
  toolbarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  selectedButton: {
    backgroundColor: '#007bff',
  },
  toolbarText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  selectedText: {
    color: 'white',
  },
});