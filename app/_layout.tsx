import { Stack } from 'expo-router';
import { GroupState } from '../backend/globalState/groupContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  /**
   * @returns the routing for the app
   */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <GroupState>
    <Stack>
      {/* for the signing in / up routes */}
      <Stack.Screen name="index" options={{ title:"back", headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: true }} />

      {/* for the MAIN APP tab routes */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }}  
      />
      <Stack.Screen 
        name="(screens)" 
        options={{ headerShown: false }}  
      />
    </Stack>
    </GroupState>
    </GestureHandlerRootView>
  );
}