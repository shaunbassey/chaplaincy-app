// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4aZRqB5llk9VoP40ZBZ9J-8DLIh7zHUw",
  authDomain: "chaplaincy-app.firebaseapp.com",
  projectId: "chaplaincy-app",
  storageBucket: "chaplaincy-app.firebasestorage.app",
  messagingSenderId: "919772184908",
  appId: "1:919772184908:web:b3ae887a3b74c2274b4fe9",
  measurementId: "G-4GSHL8PLHG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);