import { View, Text, StyleSheet } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { acceptInviteButton } from "../../backend/acceptInviteButton";
import { Button } from "react-native";

export default function NotificationPage () {
    const [loading, setLoading] = useState(false);
    const [notificationDetails, setNotificationDetails] = useState([]);
    const user = auth.currentUser;
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }  
        const notificationsRef = collection(db, "users", user.uid, "notifications");
        //const notificationsSnapshot = await getDoc(notificationsRef);
        // set up a listener for notifications
        const unsubscribe = onSnapshot(notificationsRef, (docSnapshot) => {
                // since its a collection which contains different docs
                // (docs being the individuals notifications)
                // craete a temp array with data of each id
                const notificationData = docSnapshot.docs.map(notificationDoc => notificationDoc.data());
                setNotificationDetails(notificationData);

        }, (error) => {
            console.error("Error fetching user's groups: ", error);
            setLoading(false);
        });
        //clean up event listener
        return () => unsubscribe();
    }, [user]);

    const handleAcceptButtonClick = async (notification: any) => {
        await acceptInviteButton(notification); 
    };

    return (
        <View style={styles.container}>
            {notificationDetails.map((notification, index) => (
                <View key={index} style={styles.notificationContainer}>
                    <Text style={styles.notificationText}>{notification.content}</Text>
                    {notification.notificationType === "groupInvite" && (
                        <Button 
                            title="Accept" 
                            onPress={() => handleAcceptButtonClick(notification)}
                            color="white"
                        />
                    )}
                </View>
            ))}
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',  
        padding: 16,
    }, 
    notificationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#007bff',  
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    notificationText: {
        color: '#fff',  
        fontSize: 16,
        marginBottom: 8,
    }
});