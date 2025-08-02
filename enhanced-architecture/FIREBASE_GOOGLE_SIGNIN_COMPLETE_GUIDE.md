# 🔐 Complete Firebase Google Sign-In Implementation Guide

## 🎯 **Overview**

This guide implements Google Account Sign-In using Firebase's **free tier** with support for web, mobile, and cross-platform applications. The implementation is production-ready and follows Firebase best practices.

## 🔥 **Firebase Free Tier Benefits**

### **✅ What's Included (FREE)**
- **Unlimited Google Sign-ins** - No user limits
- **Authentication for all platforms** - Web, Android, iOS, Flutter
- **Real-time user management** - User profiles and sessions
- **Security features** - JWT tokens, session management
- **Multi-platform support** - One setup works everywhere

### **💰 Cost Breakdown**
- **Google Authentication**: **FREE** (unlimited users)
- **Email/Password Auth**: **FREE** (unlimited users)  
- **Phone Authentication**: **FREE** (10,000 verifications/month)
- **Database operations**: **FREE** (1GB storage, 10GB transfer/month)
- **Hosting**: **FREE** (10GB storage, 360MB/day transfer)

## 🚀 **Step-by-Step Implementation**

### **Step 1: Create Firebase Project**

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Project Configuration:**
   ```
   Project name: portfolio-auth-pro
   Google Analytics: Enable (recommended for insights)
   Location: Choose your region
   ```

### **Step 2: Register Your App with Firebase**

#### **For Web App:**
1. **Go to Project Settings → General**
2. **Click "Add app" → Web**
3. **App Configuration:**
   ```
   App nickname: portfolio-web
   Firebase Hosting: No (using Vercel/custom hosting)
   ```
4. **Copy the configuration object** (you'll need this)

#### **For Android App (Optional):**
1. **Click "Add app" → Android**
2. **Provide:**
   ```
   Package name: com.yourname.portfolio
   App nickname: Portfolio Android
   SHA-1 certificate: (generate using keytool)
   ```

#### **For iOS App (Optional):**
1. **Click "Add app" → iOS**
2. **Provide:**
   ```
   Bundle ID: com.yourname.portfolio
   App nickname: Portfolio iOS
   ```

### **Step 3: Enable Google Sign-In**

1. **Go to Authentication → Sign-in method**
2. **Click on "Google" provider**
3. **Configuration:**
   ```
   Enable: Toggle ON
   Project support email: your-email@gmail.com
   Project public-facing name: Your Portfolio
   ```
4. **Click "Save"**

### **Step 4: Configure Authorized Domains**

1. **In Authentication → Sign-in method → Authorized domains**
2. **Add your domains:**
   ```
   localhost (for development)
   your-domain.com (for production)
   your-app.vercel.app (for Vercel deployment)
   ```

### **Step 5: Set Up Realtime Database**

1. **Go to Realtime Database**
2. **Click "Create Database"**
3. **Configuration:**
   ```
   Location: us-central1 (free tier)
   Security rules: Start in test mode
   ```

### **Step 6: Configure Security Rules**

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "portfolio": {
      "public": {
        ".read": true,
        ".write": false
      },
      "admin": {
        ".read": "auth != null && auth.token.admin == true",
        ".write": "auth != null && auth.token.admin == true"
      }
    }
  }
}
```

## 🔧 **Enhanced Implementation**

Let me create an enhanced Google Authentication service:

<function_calls>
<invoke name="fsWrite">
<parameter name="path">enhanced-architecture/src/services/firebase-google-auth-enhanced.jsanced Firebase Google Authentication Service
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { getDatabase, ref, set, get, update, remove } from 'firebase/database';
import { getAnalytics, logEvent } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Admin configuration
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map(email => email.trim())
  .filter(email => email.length > 0);

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your-public-api-key' && 
  firebaseConfig.projectId;

console.log('🔥 Firebase configured:', isFirebaseConfigured);
console.log('👤 Admin emails:', ADMIN_EMAILS);

let app, auth, database, analytics, googleProvider;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    
    // Initialize Analytics (optional)
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
    
    // Configure Google Auth Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      hd: '' // Allow any domain, remove if you want to restrict to specific domain
    });
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
}

class EnhancedGoogleAuthService {
  constructor() {
    this.currentUser = null;
    this.isConfigured = isFirebaseConfigured;
    this.authStateListeners = [];
    this.isInitialized = false;
    
    if (this.isConfigured) {
      this.initializeAuth();
    }
  }

  async initializeAuth() {
    try {
      // Listen for auth state changes
      onAuthStateChanged(auth, (user) => {
        this.handleAuthStateChange(user);
      });

      // Check for redirect result (mobile/popup blocked scenarios)
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('✅ Redirect sign-in successful');
        this.logAnalyticsEvent('login', { method: 'google_redirect' });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  async handleAuthStateChange(user) {
    if (user && this.isAdminEmail(user.email)) {
      // User is authenticated and is admin
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        isAdmin: true,
        emailVerified: user.emailVerified,
        lastLogin: new Date().toISOString()
      };

      this.currentUser = userData;
      
      // Save user data to database
      await this.saveUserToDatabase(userData);
      
      // Log analytics event
      this.logAnalyticsEvent('user_authenticated', {
        user_id: user.uid,
        method: 'google'
      });
      
    } else if (user && !this.isAdminEmail(user.email)) {
      // User is authenticated but not admin - sign them out
      console.warn('Non-admin user attempted access:', user.email);
      await this.signOut();
      this.currentUser = null;
      
    } else {
      // User is not authenticated
      this.currentUser = null;
    }
    
    // Notify listeners
    this.authStateListeners.forEach(callback => callback(this.currentUser));
  }

  isAdminEmail(email) {
    return ADMIN_EMAILS.includes(email);
  }

  // Google Sign-In with Popup (Primary method)
  async signInWithGoogle() {
    if (!this.isConfigured) {
      return this.mockGoogleSignIn();
    }

    try {
      console.log('🔐 Starting Google sign-in...');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      console.log('✅ Google sign-in successful:', user.email);
      
      // Check if user is admin
      if (!this.isAdminEmail(user.email)) {
        await this.signOut();
        throw new Error(`Access denied. Only authorized emails can access this dashboard.\nAuthorized: ${ADMIN_EMAILS.join(', ')}`);
      }
      
      // Get additional user info
      const additionalUserInfo = result._tokenResponse;
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        isAdmin: true,
        emailVerified: user.emailVerified,
        isNewUser: additionalUserInfo?.isNewUser || false,
        provider: 'google.com',
        lastLogin: new Date().toISOString()
      };
      
      // Save to database
      await this.saveUserToDatabase(userData);
      
      // Log analytics
      this.logAnalyticsEvent('login', {
        method: 'google_popup',
        is_new_user: userData.isNewUser
      });
      
      return {
        success: true,
        user: userData,
        token: await user.getIdToken(),
        credential: credential
      };
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        // Fallback to redirect method
        console.log('Popup blocked, trying redirect method...');
        return this.signInWithGoogleRedirect();
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.message.includes('Access denied')) {
        throw error;
      } else {
        throw new Error('Failed to sign in with Google. Please try again.');
      }
    }
  }

  // Google Sign-In with Redirect (Fallback for mobile/popup issues)
  async signInWithGoogleRedirect() {
    if (!this.isConfigured) {
      return this.mockGoogleSignIn();
    }

    try {
      console.log('🔄 Using redirect sign-in method...');
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled in initializeAuth() via getRedirectResult()
    } catch (error) {
      console.error('Redirect sign-in error:', error);
      throw new Error('Failed to initiate Google sign-in redirect.');
    }
  }

  // Mock Google Sign-In for development
  async mockGoogleSignIn() {
    console.log('🔧 Using mock Google authentication');
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      uid: 'mock-admin-uid',
      email: ADMIN_EMAILS[0] || 'admin@example.com',
      name: 'Admin User (Mock)',
      photoURL: 'https://via.placeholder.com/100x100?text=Admin',
      isAdmin: true,
      emailVerified: true,
      isNewUser: false,
      provider: 'mock',
      lastLogin: new Date().toISOString()
    };
    
    this.currentUser = mockUser;
    
    return {
      success: true,
      user: mockUser,
      token: 'mock-jwt-token',
      credential: null
    };
  }

  // Enhanced Sign Out
  async signOut() {
    try {
      if (this.isConfigured && auth.currentUser) {
        await signOut(auth);
      }
      
      this.currentUser = null;
      
      // Clear local storage
      localStorage.removeItem('adminUser');
      sessionStorage.clear();
      
      // Log analytics
      this.logAnalyticsEvent('logout');
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Save user data to Firebase Database
  async saveUserToDatabase(userData) {
    if (!this.isConfigured) return;

    try {
      const userRef = ref(database, `users/${userData.uid}`);
      await set(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      });
      
      // Also save to admin collection
      const adminRef = ref(database, `portfolio/admins/${userData.uid}`);
      await set(adminRef, {
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL,
        lastLogin: userData.lastLogin,
        isActive: true
      });
      
    } catch (error) {
      console.error('Error saving user to database:', error);
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    if (!this.isConfigured || !auth.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, updates);
      
      // Update database
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      await update(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      // Update current user object
      this.currentUser = {
        ...this.currentUser,
        ...updates
      };
      
      console.log('✅ Profile updated successfully');
      return this.currentUser;
      
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Delete user account
  async deleteAccount() {
    if (!this.isConfigured || !auth.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const uid = auth.currentUser.uid;
      
      // Remove from database
      await remove(ref(database, `users/${uid}`));
      await remove(ref(database, `portfolio/admins/${uid}`));
      
      // Delete Firebase Auth account
      await deleteUser(auth.currentUser);
      
      this.currentUser = null;
      
      console.log('✅ Account deleted successfully');
      
    } catch (error) {
      console.error('Account deletion error:', error);
      throw new Error('Failed to delete account');
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
  async getIdToken(forceRefresh = false) {
    if (!this.isConfigured) {
      return 'mock-jwt-token';
    }
    
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(forceRefresh);
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
      if (this.isInitialized) {
        resolve(this.currentUser);
        return;
      }
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user && this.isAdminEmail(user.email) ? this.currentUser : null);
      });
    });
  }

  // Analytics logging
  logAnalyticsEvent(eventName, parameters = {}) {
    if (analytics) {
      try {
        logEvent(analytics, eventName, parameters);
      } catch (error) {
        console.warn('Analytics logging failed:', error);
      }
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

  // Get user statistics
  async getUserStats() {
    if (!this.isConfigured || !this.currentUser) return null;

    try {
      const userRef = ref(database, `users/${this.currentUser.uid}`);
      const snapshot = await get(userRef);
      return snapshot.val();
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Check service status
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      initialized: this.isInitialized,
      authenticated: this.isAuthenticated(),
      adminEmails: ADMIN_EMAILS,
      currentUser: this.currentUser ? {
        email: this.currentUser.email,
        name: this.currentUser.name,
        isAdmin: this.currentUser.isAdmin
      } : null
    };
  }
}

// Create and export singleton instance
const enhancedGoogleAuthService = new EnhancedGoogleAuthService();
export default enhancedGoogleAuthService;

// Export individual functions for convenience
export const {
  signInWithGoogle,
  signInWithGoogleRedirect,
  signOut: signOutUser,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  getIdToken,
  onAuthStateChanged: onAuthStateChange,
  waitForAuth,
  makeAuthenticatedRequest,
  updateUserProfile,
  deleteAccount,
  getUserStats,
  getServiceStatus
} = enhancedGoogleAuthService;