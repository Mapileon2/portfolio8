// Firebase Configuration for Frontend
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAep3-lFOQyG97RaYB-iozVWVzlSa_LhV0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "portfolioyt-c0193.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "portfolioyt-c0193",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "portfolioyt-c0193.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "473310186496",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:473310186496:web:c45acce229e30723535ce5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-595XLH1CBM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not available:', error.message);
  }
}

export { analytics };
export default app;

// Export configuration for debugging
export const config = firebaseConfig;