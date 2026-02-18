// Firebase SDKs
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getFirestore } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   FIREBASE CONFIG
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAfe1hyfhklceFY5cyUArOPkXsz-b86Qsc",
  authDomain: "trustlink-7fa4c.firebaseapp.com",
  projectId: "trustlink-7fa4c",
  storageBucket: "trustlink-7fa4c.firebasestorage.app",
  messagingSenderId: "37568739846",
  appId: "1:37568739846:web:0a9174303e8eaf58b92187",
  measurementId: "G-P9FE6HF6EB"
};

/* ===============================
   INITIALIZE APP
================================ */
const app = initializeApp(firebaseConfig);

/* ===============================
   EXPORT FIRESTORE
================================ */
export const db = getFirestore(app);
