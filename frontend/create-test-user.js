// Script to create a test admin user using Firebase client SDK
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration - same as in firebase-config.js
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
const auth = getAuth(app);

// Admin user credentials
const email = "admin@example.com";
const password = "Admin123!";

// Create the admin user
createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // User created successfully
    const user = userCredential.user;
    console.log("Admin user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("User ID:", user.uid);
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    
    if (errorCode === "auth/email-already-in-use") {
      console.log("Note: This email already exists. You can use these credentials to log in:");
      console.log("Email:", email);
      console.log("Password:", password);
    } else {
      console.error("Error creating user:", errorCode, errorMessage);
    }
  }); 