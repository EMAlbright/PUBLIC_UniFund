import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, SafeAreaView } from 'react-native';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import LogoutButton from '../../components/logoutButton';
import CreateGroupButton from '../../components/createGroupButton';
import UserSearchBar from '../../components/userSearchbar';
import { ViewGroups } from '../../components/viewGroups';
import { useGroup } from '../../backend/globalState/groupContext';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { BudgetChart } from '../../components/budgetChart';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const {group} = useGroup();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data().profile);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // setup listener for notification count
  useEffect(() => {
        const user = auth.currentUser;
        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(userDocRef, (querySnapshot) => {
          let notificationCount = querySnapshot.data().notificationCount;
          setNotificationCount(notificationCount);
        })
        return () => unsubscribe();
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={() => router.push('/notifications')}
        >
        <Text style={styles.notificationButtonText}> {notificationCount} Notifications</Text>
        </TouchableOpacity>
      <LogoutButton />
      </View>
      <FlatList
        data={[{ key: 'profile' }, { key: 'search' }, { key: 'viewGroups' }, { key: 'createGroup' }]}
        renderItem={({ item }) => (
          <View>
            {item.key === 'profile' && (
            <Text style={styles.headerText}>
              Hello, {userData?.username || 'User'}
            </Text>
            )}
            {/** search for a user */}
            {item.key === 'search' && (
              <View style={styles.searchContainer}>
                <UserSearchBar />
              </View>
            )}

            {/** view the current groups you are in */}
            {item.key === 'viewGroups' && <ViewGroups />}

            {/** create a new group */}
            {item.key === 'createGroup' && (
                <CreateGroupButton />
            )}
          </View>
          
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.contentContainer}
        ListFooterComponent={<BudgetChart />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007bff',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'center'
  },  
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 20,
  },
  groupButtonSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonSection: {
    width: '100%',
    bottom: 0,
    paddingVertical: 20,
    alignItems: 'center',
  },
  notificationButton: {
    backgroundColor: '#003f7f',
    paddingVertical: 5 ,     
    paddingHorizontal: 10,  
    borderRadius: 5,         
  },
  notificationButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
