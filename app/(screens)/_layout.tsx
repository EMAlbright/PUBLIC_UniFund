import { Stack } from "expo-router";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";

export default function ScreensLayout(){
    const router = useRouter();
  return(
    <Stack>
      <Stack.Screen 
        name="notifications" 
        options={{ title: "Notifications", 
        headerShown: true,
        headerLeft: () => null,
        headerRight: () => (
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: 'blue', marginRight: 10 }}>Close</Text>
          </Pressable>
        ), }} />
    </Stack>
  )
}