import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDfs9kNKSb-M-52nFZjACyMHSnHq09_tZQ",
    authDomain: "empatho-d307b.firebaseapp.com",
    projectId: "empatho-d307b",
    storageBucket: "empatho-d307b.appspot.com",
    messagingSenderId: "783414708271",
    appId: "1:783414708271:web:d19e51c4e884ee65501eda"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Auth
export const auth = getAuth(app);
export { db };
export const storage = getStorage(app);
