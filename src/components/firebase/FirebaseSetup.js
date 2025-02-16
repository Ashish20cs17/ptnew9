// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpRHSVSqeFGW-nU8TXsR7u0Rcvwlut-0I",
  authDomain: "practicetime-182c4.firebaseapp.com",
  databaseURL: "https://practicetime-182c4-default-rtdb.firebaseio.com",
  projectId: "practicetime-182c4",
  storageBucket: "practicetime-182c4.firebasestorage.app",
  messagingSenderId: "500977746147",
  appId: "1:500977746147:web:74fc2e3fce84c518c2c5d6",
  measurementId: "G-KDGDE38D3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;