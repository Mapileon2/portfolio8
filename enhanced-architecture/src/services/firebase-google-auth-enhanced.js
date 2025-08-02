// Enhanced Firebase Google Authentication Service
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

// Admin configuration - supports multiple admin emails
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map(email => email.trim())
  .filter(email => email.length > 0);

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your-public-api-key' && 
  firebaseConfig.projectId;

console.log('🔥 Enhanced Firebase configured:', isFirebaseConfigured);
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
    
    // Configure Google Auth Provider with enhanced settings
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      hd: '' // Allow any domain, remove if you want to restrict to specific domain
    });
    
    console.log('✅ Enhanced Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Enhanced Firebase initialization failed:', error);
  }
}

class EnhancedGoogleAuthService {
  constructor() {
    this.currentUser = null;
    this.isConfigured = isFirebaseConfigured;
    this.authStateListeners = [];
    this.isInitialized = false;
    this.signInMethod = 'popup'; // 'popup' or 'redirect'
    
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
        lastLogin: new Date().toISOString(),
        provider: user.providerData[0]?.providerId || 'google.com'
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
      console.warn('❌ Non-admin user attempted access:', user.email);
      await this.signOut();
      this.currentUser = null;
      
      // Show error to user
      this.notifyAuthStateListeners(null, {
        error: `Access denied. Only authorized emails can access this dashboard.\nAuthorized: ${ADMIN_EMAILS.join(', ')}`
      });
      
    } else {
      // User is not authenticated
      this.currentUser = null;
    }
    
    // Notify listeners
    this.notifyAuthStateListeners(this.currentUser);
  }

  notifyAuthStateListeners(user, extra = {}) {
    this.authStateListeners.forEach(callback => callback(user, extra));
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
      console.log('🔐 Starting Google sign-in with popup...');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      console.log('✅ Google sign-in successful:', user.email);
      
      // Check if user is admin
      if (!this.isAdminEmail(user.email)) {
        await this.signOut();
        throw new Error(`Access denied. Only authorized emails can access this dashboard.\n\nAuthorized emails:\n${ADMIN_EMAILS.join('\n')}\n\nYour email: ${user.email}`);
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
        console.log('🔄 Popup blocked, trying redirect method...');
        return this.signInWithGoogleRedirect();
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many sign-in attempts. Please wait a moment and try again.');
      } else if (error.message.includes('Access denied')) {
        throw error;
      } else {
        throw new Error(`Failed to sign in with Google: ${error.message}`);
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
      this.signInMethod = 'redirect';
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
      
      console.log('✅ User data saved to database');
      
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

  // Auth state listener with enhanced error handling
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
        console.log(`📊 Analytics: ${eventName}`, parameters);
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
      signInMethod: this.signInMethod,
      currentUser: this.currentUser ? {
        email: this.currentUser.email,
        name: this.currentUser.name,
        isAdmin: this.currentUser.isAdmin,
        provider: this.currentUser.provider
      } : null
    };
  }

  // Force refresh authentication
  async refreshAuth() {
    if (!this.isConfigured || !auth.currentUser) return;

    try {
      await auth.currentUser.reload();
      const token = await auth.currentUser.getIdToken(true);
      console.log('✅ Authentication refreshed');
      return token;
    } catch (error) {
      console.error('Auth refresh error:', error);
      throw error;
    }
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
  getServiceStatus,
  refreshAuth
} = enhancedGoogleAuthService;