import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDfs9kNKSb-M-52nFZjACyMHSnHq09_tZQ",
  authDomain: "empatho-d307b.firebaseapp.com",
  projectId: "empatho-d307b",
  storageBucket: "empatho-d307b.firebasestorage.app",
  messagingSenderId: "783414708271",
  appId: "1:783414708271:web:d19e51c4e884ee65501eda"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app); 