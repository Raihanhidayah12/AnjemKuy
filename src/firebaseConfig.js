// ============================================================
// src/firebaseConfig.js
// Firebase Modular SDK v9+ initialization
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_GxNjTnt3LfzIhfsvE4kGtiiq1b1ZfSI",
  authDomain: "anjemkuy-1451d.firebaseapp.com",
  projectId: "anjemkuy-1451d",
  storageBucket: "anjemkuy-1451d.firebasestorage.app",
  messagingSenderId: "318890547609",
  appId: "1:318890547609:web:bbee111b9883f9e97b5b08",
  measurementId: "G-DJFEVXRGH8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
