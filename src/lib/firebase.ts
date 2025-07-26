// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add your own Firebase configuration from your project settings
// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = firebaseConfig.apiKey !== 'YOUR_API_KEY' ? getDatabase(app) : null;

function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

export { db, isFirebaseConfigured };
