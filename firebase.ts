
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ANU Devotion System Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4aZRqB5llk9VoP40ZBZ9J-8DLIh7zHUw",
  authDomain: "chaplaincy-app.firebaseapp.com",
  projectId: "chaplaincy-app",
  storageBucket: "chaplaincy-app.firebasestorage.app",
  messagingSenderId: "919772184908",
  appId: "1:919772184908:web:b3ae887a3b74c2274b4fe9",
  measurementId: "G-4GSHL8PLHG"
};

// Singleton initialization pattern to prevent multiple instances
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export services for application-wide use
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
