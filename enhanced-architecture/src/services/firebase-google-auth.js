// Firebase Google Authentication Service
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Admin email from environment
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'your-email@gmail.com';

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your-public-api-key' && 
  firebaseConfig.projectId;

console.log('🔥 Firebase configured:', isFirebaseConfigured);

let app, auth, database, googleProvider;

if (isFirebaseConfigured) {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  
  // Configure Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

class GoogleAuthService {
  constructor() {
    this.currentUser = null;
    this.isConfigured = isFirebaseConfigured;
    this.authStateListeners = [];
    
    if (this.isConfigured) {
      // Listen for auth state changes
      onAuthStateChanged(auth, (user) => {
        this.handleAuthStateChange(user);
      });
    }
  }

  async handleAuthStateChange(user) {
    if (user && user.email === ADMIN_EMAIL) {
      this.currentUser = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        isAdmin: true
      };
    } else {
      this.currentUser = null;
    }
    
    // Notify listeners
    this.authStateListeners.forEach(callback => callback(this.currentUser));
  }

  // Google Sign-In
  async signInWithGoogle() {
    if (!this.isConfigured) {
      // Mock authentication for development
      return this.mockGoogleSignIn();
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('Google sign-in successful:', user.email);
      
      // Check if user is admin
      if (user.email !== ADMIN_EMAIL) {
        await this.signOut();
        throw new Error(`Access denied. Only ${ADMIN_EMAIL} can access this dashboard.`);
      }
      
      // Store user data in database
      await set(ref(database, `portfolio/users/${user.uid}`), {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        isAdmin: true,
        lastLogin: new Date().toISOString()
      });
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        isAdmin: true
      };
      
      this.currentUser = userData;
      
      return {
        success: true,
        user: userData,
        token: await user.getIdToken()
      };
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked. Please allow pop-ups and try again.');
      } else if (error.message.includes('Access denied')) {
        throw error;
      } else {
        throw new Error('Failed to sign in with Google. Please try again.');
      }
    }
  }

  // Mock Google Sign-In for development
  async mockGoogleSignIn() {
    console.log('🔧 Using mock Google authentication');
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      uid: 'mock-admin-uid',
      email: ADMIN_EMAIL,
      name: 'Admin User',
      photoURL: 'https://via.placeholder.com/100x100?text=Admin',
      isAdmin: true
    };
    
    this.currentUser = mockUser;
    
    return {
      success: true,
      user: mockUser,
      token: 'mock-jwt-token'
    };
  }

  // Sign Out
  async signOut() {
    try {
      if (this.isConfigured) {
        await signOut(auth);
      }
      this.currentUser = null;
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUser?.isAdmin === true;
  }

  // Get ID token for API calls
  async getIdToken() {
    if (!this.isConfigured) {
      return 'mock-jwt-token';
    }
    
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  }

  // Auth state listener
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Wait for auth to be ready
  async waitForAuth() {
    if (!this.isConfigured) {
      return this.currentUser;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user && user.email === ADMIN_EMAIL ? this.currentUser : null);
      });
    });
  }

  // Database helpers
  async saveUserData(data) {
    if (!this.isConfigured || !this.currentUser) return;
    
    try {
      await set(ref(database, `portfolio/users/${this.currentUser.uid}`), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  async getUserData() {
    if (!this.isConfigured || !this.currentUser) return null;
    
    try {
      const snapshot = await get(ref(database, `portfolio/users/${this.currentUser.uid}`));
      return snapshot.val();
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // API helper for authenticated requests
  async makeAuthenticatedRequest(url, options = {}) {
    const token = await this.getIdToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }
}

// Create and export singleton instance
const googleAuthService = new GoogleAuthService();
export default googleAuthService;

// Export individual functions for convenience
export const {
  signInWithGoogle,
  signOut: signOutUser,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  getIdToken,
  onAuthStateChanged: onAuthStateChange,
  waitForAuth,
  makeAuthenticatedRequest
} = googleAuthService;