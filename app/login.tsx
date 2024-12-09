import { signInWithEmailAndPassword } from "firebase/auth"; 
import { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { auth} from '../firebaseConfig';
import { useRouter } from "expo-router";

export default function LoginScreen () {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();


    const handleUserLogin = async() => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/(tabs)/profile');
      }
      catch(error){
        throw new Alert.alert(`${error.message}`)
      }
    }

    return (
    <View style={styles.container}>
        <TextInput
        placeholder="Email"
        value={email}
        onChangeText={text => setEmail(text)}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        />
        <TextInput
        placeholder="Password"
        value={password}
        onChangeText={text => setPassword(text)}
        secureTextEntry
        style={styles.input}
        />
        <Button title="Login" onPress={handleUserLogin} />
        {error ? <Text style={{color: 'red'}}>{error}</Text>: null}
    </View>
);
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 100,
    },
    input: {
      width: 300,
      height: 40,
      borderColor: 'gray',
      borderWidth: .5,
      padding: 10,
      marginBottom: 20,
    },
  });