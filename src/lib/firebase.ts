// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add your own Firebase configuration from your project settings
// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  "projectId": "whispernet-32cr1",
  "appId": "1:775917199401:web:0d99614946b7c793ddbc38",
  "storageBucket": "whispernet-32cr1.firebasestorage.app",
  "apiKey": "AIzaSyDc_-ZiIvgqI1LDWwA1YKMdbZUdkzrEwi8",
  "authDomain": "whispernet-32cr1.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "775917199401",
  "databaseURL": "https://whispernet-32cr1.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = firebaseConfig.apiKey !== 'YOUR_API_KEY' ? getDatabase(app) : null;

function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

export { db, isFirebaseConfigured };
