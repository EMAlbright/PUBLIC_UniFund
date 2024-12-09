import { useRouter } from "expo-router"
import {auth} from '../firebaseConfig';
import { TouchableOpacity, StyleSheet, Text} from 'react-native';
import { useGroup } from "../backend/globalState/groupContext";
import { Firestore } from "firebase/firestore";

export default function LogoutButton () {
    const router = useRouter();
    const { group, setGroup } = useGroup();
    const handleLogout = async() => {
        try{
            //unsbscribe all listeners so no permission errors occur
            // reset global state of group
            setGroup(null);
            auth.signOut();
            router.push('/');
        }
        catch(error) {
            console.log(error);
        }
    }
    return (
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007AFF',  
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white', 
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
});