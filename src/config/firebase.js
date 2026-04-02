// Import the functions you need from the SDKs you need9
import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfAV7n6JjVeVUgv6w9hkHhTXhX-fpXeNw",
  authDomain: "stichei-app.firebaseapp.com",
  projectId: "stichei-app",
  storageBucket: "stichei-app.firebasestorage.app",
  messagingSenderId: "82326768428",
  appId: "1:82326768428:web:86fdcd68acd3b63a8c7a89",
  measurementId: "G-T37EJ2V0Z1",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// services
const db = getFirestore(app);
const auth = getAuth(app);

// export
export { db, auth };
export default app;
