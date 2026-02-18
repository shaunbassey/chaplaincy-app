
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ANU Devotion System Firebase Configuration 
const firebaseConfig = {
  apiKey: "AIzaSyCaoJEsCSSZT4PhcVROlxkVc2xPUoxmYFQ",
  authDomain: "chaplaincy-app.firebaseapp.com",
  projectId: "chaplaincy-app",
  storageBucket: "chaplaincy-app.firebasestorage.app",
  messagingSenderId: "919772184908",
  appId: "1:919772184908:web:b3ae887a3b74c2274b4fe9",
  measurementId: "G-4GSHL8PLHG"
};

// Initialize Firebase once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
