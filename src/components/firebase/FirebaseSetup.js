// Import necessary Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Added storage module

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpRHSVSqeFGW-nU8TXsR7u0Rcvwlut-0I",
  authDomain: "practicetime-182c4.firebaseapp.com",
  databaseURL: "https://practicetime-182c4-default-rtdb.firebaseio.com",
  projectId: "practicetime-182c4",
  storageBucket: "practicetime-182c4.appspot.com",
  messagingSenderId: "500977746147",
  appId: "1:500977746147:web:74fc2e3fce84c518c2c5d6",
  measurementId: "G-KDGDE38D3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize authentication
const database = getDatabase(app); // Initialize Realtime Database
const analytics = getAnalytics(app); // Initialize analytics
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize storage

// Export necessary Firebase instances
export { auth, database, analytics, db, storage };
export default app;