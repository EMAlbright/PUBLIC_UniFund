import { initializeApp } from 'firebase/app';
import { initializeAuth} from "firebase/auth";
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import "firebase/firestore";
import config from './config';
import { FIREBASE_KEY, FIREBASE_AUTHDOMAIN, FIREBASE_PROJECTID, FIREBASE_STORAGEBUCKET, FIREBASE_SENDERID, FIREBASE_APPID } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This file sets up firebase
const firebaseConfig = {
  apiKey: config.EXPO_PUBLIC_FIREBASE_KEY,  
  authDomain: config.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId: config.EXPO_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: config.EXPO_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: config.EXPO_PUBLIC_FIREBASE_SENDERID,
  appId: config.EXPO_PUBLIC_FIREBASE_APPID
};

//initialize firebase
const app = initializeApp(firebaseConfig);

// user authentication
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
// firestore
const db = getFirestore(app);

export { auth, db, app };
