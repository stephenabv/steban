import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCegVdNHtzzniqnBYtiQPlNZUp53aCBSiE",
  authDomain: "steban-5889b.firebaseapp.com",
  projectId: "steban-5889b",
  storageBucket: "steban-5889b.firebasestorage.app",
  messagingSenderId: "773468376389",
  appId: "1:773468376389:web:1c97d6fd834dab3ca7022c",
  measurementId: "G-NWG7VMMQ87",
};

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
