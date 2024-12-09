import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
export default function TabsLayout() {
  // wrap this navigation in GroupState
  return (
    <Tabs
    screenOptions={{
      tabBarLabelStyle: { color: 'black', fontSize: 10 },
    }}
    >
      <Tabs.Screen name="budget" options={{ tabBarLabel: 'Budget', headerShown: false, tabBarIcon: () => (<Ionicons name='calendar' size={30}/>) }} />
      <Tabs.Screen name="transactions" options={{ tabBarLabel: 'Transactions', headerShown: false, tabBarIcon: () => (<Ionicons name='cash' size={30}/>) }} />
      <Tabs.Screen name="profile" options={{ tabBarLabel: 'Profile', headerShown: false, tabBarIcon: () => (<Ionicons name='person' size={30}/>) }} />
    </Tabs>
  );
}