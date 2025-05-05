// Firebase configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnMJTvWwTWMwnl1LPXaDZPpOkOKa-uELM",
  authDomain: "projectportfolio-29467.firebaseapp.com",
  projectId: "projectportfolio-29467",
  storageBucket: "projectportfolio-29467.appspot.com",
  messagingSenderId: "159555817081",
  appId: "1:159555817081:web:eb85ea7b9f26dd2731d1ce",
  measurementId: "G-5BD3WPWSZR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { db, auth, storage, analytics }; 