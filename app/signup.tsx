import { createUserWithEmailAndPassword } from "firebase/auth"; 
import { doc, getDocs, setDoc, collection, query, where, limit } from "firebase/firestore";
import { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';

export default function UserSignUpScreen () {

    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const [error, setError] = useState('');

    // check if a username is unqique
    const isUsernameUnique = async(username: string) => {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("profile.username", "==", username),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    }

    const handleUserSignUp = async() => {
      try{
        const userCredential = await createUserWithEmailAndPassword(auth,email, password);
        const user = userCredential.user;
        // check if the username is uniqu
        // if its not then throw an error
        const isUnique = await isUsernameUnique(username);
        console.log(isUnique);
        if (!isUnique) {
          await user.delete();
          throw Alert.alert("Username already exists. Please choose a different one.");
          return;
        }

          // Signed up 
          // store user email at current time in firestore
          // store this unique user in the db under users
          // profile is a field of type MAP inside USER.UID
          await setDoc(doc(db, "users", user.uid), {
            profile: {
              username: username,
              email: user.email,
              createdAt: new Date().toISOString(),
            }
          });
          // on signup success, push user to the app home screen
          router.push('/(tabs)/profile');
      }
      // if user already exists (uid) exists then error
      // or for whatever reason
      catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
        return({errorCode} +  " uh oh! " + {errorMessage} );
      }
    };

    return (
        <View style={styles.container}>
            <TextInput
            placeholder="Username"
            value={username}
            onChangeText={text => setUsername(text)}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            />
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
            <Button title="Sign Up" onPress={handleUserSignUp} />
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

