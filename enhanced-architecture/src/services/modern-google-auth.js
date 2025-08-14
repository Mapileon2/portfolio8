// Modern Google Authentication Service
// Inspired by best practices and modern UX patterns

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
  deleteUser,
  reauthenticateWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { getDatabase, ref, set, get, update, remove, push } from 'firebase/database';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance, trace } from 'firebase/performance';

// Enhanced Firebase configuration with your actual credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAep3-lFOQyG97RaYB-iozVWVzlSa_LhV0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "portfolioyt-c0193.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "portfolioyt-c0193",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "portfolioyt-c0193.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "473310186496",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:473310186496:web:c45acce229e30723535ce5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-595XLH1CBM",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://portfolioyt-c0193-default-rtdb.firebaseio.com"
};

// Enhanced admin configuration with role-based access
const ADMIN_CONFIG = {
  emails: (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0),
  domains: (import.meta.env.VITE_ADMIN_DOMAINS || '')
    .split(',')
    .map(domain => domain.trim())
    .filter(domain => domain.length > 0),
  roles: {
    superAdmin: import.meta.env.VITE_SUPER_ADMIN_EMAIL || '',
    admins: [],
    editors: []
  }
};

// Validate Firebase configuration
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your-public-api-key' && 
  firebaseConfig.projectId &&
  firebaseConfig.authDomain;

console.log('🔥 Modern Firebase configured:', isFirebaseConfigured);
console.log('👤 Admin configuration:', ADMIN_CONFIG);

let app, auth, database, analytics, performance, googleProvider;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase with error handling
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    
    // Initialize optional services
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
    
    if (typeof window !== 'undefined') {
      performance = getPerformance(app);
    }
    
    // Configure Google Auth Provider with enhanced settings
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.addScope('openid');
    
    // Enhanced provider settings
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'offline',
      include_granted_scopes: true,
      // hd: 'yourdomain.com' // Uncomment to restrict to specific domain
    });
    
    console.log('✅ Modern Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Modern Firebase initialization failed:', error);
  }
}

class ModernGoogleAuthService {
  constructor() {
    this.currentUser = null;
    this.isConfigured = isFirebaseConfigured;
    this.authStateListeners = [];
    this.isInitialized = false;
    this.signInMethod = 'popup';
    this.sessionData = new Map();
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Device and browser detection
    this.deviceInfo = this.getDeviceInfo();
    
    if (this.isConfigured) {
      this.initializeAuth();
    }
    
    // Setup error tracking
    this.setupErrorTracking();
  }

  async initializeAuth() {
    try {
      const authTrace = performance ? trace(performance, 'auth_initialization') : null;
      authTrace?.start();

      // Listen for auth state changes with enhanced error handling
      onAuthStateChanged(auth, (user) => {
        this.handleAuthStateChange(user);
      }, (error) => {
        console.error('Auth state change error:', error);
        this.handleAuthError(error);
      });

      // Check for redirect result with timeout
      const redirectPromise = getRedirectResult(auth);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redirect timeout')), 10000)
      );

      try {
        const result = await Promise.race([redirectPromise, timeoutPromise]);
        if (result) {
          console.log('✅ Redirect sign-in successful');
          this.logAnalyticsEvent('login', { method: 'google_redirect' });
        }
      } catch (error) {
        if (error.message !== 'Redirect timeout') {
          console.warn('Redirect result error:', error);
        }
      }

      this.isInitialized = true;
      authTrace?.stop();
      
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.handleAuthError(error);
    }
  }

  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?=.*Mobile)/i.test(userAgent),
      browser: this.getBrowserName(userAgent),
      platform,
      language,
      screenSize: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
  }

  getBrowserName(userAgent) {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  setupErrorTracking() {
    // Global error handler for auth-related errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.code?.startsWith('auth/')) {
        console.error('Unhandled auth error:', event.reason);
        this.handleAuthError(event.reason);
      }
    });
  }

  async handleAuthStateChange(user) {
    try {
      if (user && this.isAuthorizedUser(user.email)) {
        // User is authenticated and authorized
        const userData = await this.createUserData(user);
        this.currentUser = userData;
        
        // Save user data and session info
        await Promise.all([
          this.saveUserToDatabase(userData),
          this.updateUserSession(userData),
          this.logUserActivity('login', userData)
        ]);
        
        // Log analytics event
        this.logAnalyticsEvent('user_authenticated', {
          user_id: user.uid,
          method: 'google',
          device_type: this.deviceInfo.isMobile ? 'mobile' : 'desktop'
        });
        
      } else if (user && !this.isAuthorizedUser(user.email)) {
        // User is authenticated but not authorized
        console.warn('❌ Unauthorized user attempted access:', user.email);
        await this.signOut();
        this.currentUser = null;
        
        // Enhanced error message with suggestions
        const errorMessage = this.createUnauthorizedErrorMessage(user.email);
        this.notifyAuthStateListeners(null, { error: errorMessage });
        
      } else {
        // User is not authenticated
        this.currentUser = null;
        this.clearUserSession();
      }
      
      // Notify listeners
      this.notifyAuthStateListeners(this.currentUser);
      
    } catch (error) {
      console.error('Auth state change handling error:', error);
      this.handleAuthError(error);
    }
  }

  async createUserData(user) {
    const additionalInfo = await this.getUserAdditionalInfo(user.uid);
    
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName || this.extractNameFromEmail(user.email),
      photoURL: user.photoURL || this.generateAvatarUrl(user.email),
      isAdmin: true,
      emailVerified: user.emailVerified,
      lastLogin: new Date().toISOString(),
      provider: user.providerData[0]?.providerId || 'google.com',
      role: this.getUserRole(user.email),
      permissions: this.getUserPermissions(user.email),
      deviceInfo: this.deviceInfo,
      sessionId: this.generateSessionId(),
      ...additionalInfo
    };
  }

  async getUserAdditionalInfo(uid) {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      return snapshot.val() || {};
    } catch (error) {
      console.warn('Could not fetch additional user info:', error);
      return {};
    }
  }

  extractNameFromEmail(email) {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  }

  generateAvatarUrl(email) {
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', 'A8E6CF', 'FFB6C1'];
    const color = colors[email.length % colors.length];
    const initial = email.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=200&font-size=0.6`;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createUnauthorizedErrorMessage(email) {
    const suggestions = [];
    
    if (ADMIN_CONFIG.domains.length > 0) {
      const userDomain = email.split('@')[1];
      if (!ADMIN_CONFIG.domains.includes(userDomain)) {
        suggestions.push(`Try using an email from: ${ADMIN_CONFIG.domains.join(', ')}`);
      }
    }
    
    if (ADMIN_CONFIG.emails.length > 0) {
      suggestions.push(`Contact admin to add your email to the whitelist`);
    }
    
    return `Access denied. Only authorized users can access this dashboard.\n\n` +
           `Your email: ${email}\n` +
           `Authorized emails: ${ADMIN_CONFIG.emails.join(', ')}\n\n` +
           (suggestions.length > 0 ? `Suggestions:\n• ${suggestions.join('\n• ')}` : '');
  }

  notifyAuthStateListeners(user, extra = {}) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user, extra);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  isAuthorizedUser(email) {
    if (!email) return false;
    
    // Check email whitelist
    if (ADMIN_CONFIG.emails.includes(email)) return true;
    
    // Check domain whitelist
    if (ADMIN_CONFIG.domains.length > 0) {
      const domain = email.split('@')[1];
      return ADMIN_CONFIG.domains.includes(domain);
    }
    
    return ADMIN_CONFIG.emails.length === 0; // Allow all if no restrictions
  }

  getUserRole(email) {
    if (email === ADMIN_CONFIG.roles.superAdmin) return 'superAdmin';
    if (ADMIN_CONFIG.roles.admins.includes(email)) return 'admin';
    if (ADMIN_CONFIG.roles.editors.includes(email)) return 'editor';
    return 'user';
  }

  getUserPermissions(email) {
    const role = this.getUserRole(email);
    
    const permissions = {
      superAdmin: ['read', 'write', 'delete', 'admin', 'manage_users', 'system_config'],
      admin: ['read', 'write', 'delete', 'admin'],
      editor: ['read', 'write'],
      user: ['read']
    };
    
    return permissions[role] || permissions.user;
  }

  // Enhanced Google Sign-In with retry logic and better error handling
  async signInWithGoogle(options = {}) {
    if (!this.isConfigured) {
      return this.mockGoogleSignIn();
    }

    const { 
      useRedirect = false, 
      retryOnFailure = true,
      customScopes = []
    } = options;

    try {
      console.log('🔐 Starting Google sign-in...', { method: useRedirect ? 'redirect' : 'popup' });
      
      const authTrace = performance ? trace(performance, 'google_signin') : null;
      authTrace?.start();

      // Add custom scopes if provided
      if (customScopes.length > 0) {
        customScopes.forEach(scope => googleProvider.addScope(scope));
      }

      let result;
      
      if (useRedirect || this.deviceInfo.isMobile) {
        result = await this.signInWithGoogleRedirect();
      } else {
        result = await signInWithPopup(auth, googleProvider);
      }

      if (!result && useRedirect) {
        // Redirect method doesn't return immediately
        return { success: true, redirected: true };
      }

      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      console.log('✅ Google sign-in successful:', user.email);
      
      // Check authorization
      if (!this.isAuthorizedUser(user.email)) {
        await this.signOut();
        throw new Error(this.createUnauthorizedErrorMessage(user.email));
      }
      
      // Get additional user info
      const additionalUserInfo = result._tokenResponse;
      const userData = await this.createUserData(user);
      userData.isNewUser = additionalUserInfo?.isNewUser || false;
      
      // Save to database and log analytics
      await Promise.all([
        this.saveUserToDatabase(userData),
        this.logUserActivity('google_signin', userData)
      ]);
      
      this.logAnalyticsEvent('login', {
        method: useRedirect ? 'google_redirect' : 'google_popup',
        is_new_user: userData.isNewUser,
        device_type: this.deviceInfo.isMobile ? 'mobile' : 'desktop'
      });
      
      authTrace?.stop();
      this.retryCount = 0; // Reset retry count on success
      
      return {
        success: true,
        user: userData,
        token: await user.getIdToken(),
        credential: credential,
        isNewUser: userData.isNewUser
      };
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases with retry logic
      if (retryOnFailure && this.retryCount < this.maxRetries) {
        return this.handleSignInError(error, options);
      }
      
      throw this.createUserFriendlyError(error);
    }
  }

  async handleSignInError(error, originalOptions) {
    this.retryCount++;
    console.log(`🔄 Retry attempt ${this.retryCount}/${this.maxRetries}`);
    
    // Wait before retry with exponential backoff
    const delay = Math.pow(2, this.retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (error.code === 'auth/popup-blocked') {
      // Switch to redirect method
      console.log('🔄 Popup blocked, switching to redirect method...');
      return this.signInWithGoogle({ ...originalOptions, useRedirect: true });
    } else if (error.code === 'auth/network-request-failed') {
      // Retry with same method
      return this.signInWithGoogle(originalOptions);
    } else {
      // Don't retry for other errors
      throw this.createUserFriendlyError(error);
    }
  }

  createUserFriendlyError(error) {
    const errorMessages = {
      'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
      'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups or try the redirect method.',
      'auth/network-request-failed': 'Network error. Please check your connection and try again.',
      'auth/too-many-requests': 'Too many sign-in attempts. Please wait a moment and try again.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/operation-not-allowed': 'Google sign-in is not enabled. Please contact support.',
      'auth/invalid-credential': 'Invalid credentials. Please try again.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.'
    };
    
    const message = errorMessages[error.code] || `Authentication failed: ${error.message}`;
    
    return new Error(message);
  }

  // Google Sign-In with Redirect
  async signInWithGoogleRedirect() {
    if (!this.isConfigured) {
      return this.mockGoogleSignIn();
    }

    try {
      console.log('🔄 Using redirect sign-in method...');
      this.signInMethod = 'redirect';
      
      // Store state for after redirect
      sessionStorage.setItem('authMethod', 'google_redirect');
      sessionStorage.setItem('authTimestamp', Date.now().toString());
      
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled in initializeAuth() via getRedirectResult()
      
    } catch (error) {
      console.error('Redirect sign-in error:', error);
      throw new Error('Failed to initiate Google sign-in redirect.');
    }
  }

  // Enhanced Mock Google Sign-In for development
  async mockGoogleSignIn() {
    console.log('🔧 Using mock Google authentication');
    
    // Simulate realistic loading delay
    const delay = 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const mockUser = {
      uid: `mock-admin-${Date.now()}`,
      email: ADMIN_CONFIG.emails[0] || 'admin@example.com',
      name: 'Admin User (Mock)',
      photoURL: this.generateAvatarUrl(ADMIN_CONFIG.emails[0] || 'admin@example.com'),
      isAdmin: true,
      emailVerified: true,
      isNewUser: false,
      provider: 'mock',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      lastLogin: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      sessionId: this.generateSessionId()
    };
    
    this.currentUser = mockUser;
    
    // Simulate saving to database
    await this.saveUserToDatabase(mockUser);
    
    return {
      success: true,
      user: mockUser,
      token: 'mock-jwt-token',
      credential: null,
      isNewUser: false
    };
  }

  // Enhanced Sign Out with cleanup
  async signOut() {
    try {
      const signOutTrace = performance ? trace(performance, 'sign_out') : null;
      signOutTrace?.start();

      // Log activity before signing out
      if (this.currentUser) {
        await this.logUserActivity('logout', this.currentUser);
      }

      if (this.isConfigured && auth.currentUser) {
        await signOut(auth);
      }
      
      // Clear all user data and sessions
      this.currentUser = null;
      this.clearUserSession();
      this.sessionData.clear();
      
      // Clear storage
      localStorage.removeItem('adminUser');
      localStorage.removeItem('rememberedEmail');
      sessionStorage.clear();
      
      // Log analytics
      this.logAnalyticsEvent('logout', {
        device_type: this.deviceInfo.isMobile ? 'mobile' : 'desktop'
      });
      
      signOutTrace?.stop();
      console.log('✅ User signed out successfully');
      
    } catch (error) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Enhanced user session management
  async updateUserSession(userData) {
    const sessionData = {
      userId: userData.uid,
      email: userData.email,
      sessionId: userData.sessionId,
      loginTime: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      ipAddress: await this.getUserIP(),
      userAgent: navigator.userAgent
    };

    this.sessionData.set(userData.sessionId, sessionData);
    
    // Save to database
    if (this.isConfigured) {
      const sessionRef = ref(database, `sessions/${userData.uid}/${userData.sessionId}`);
      await set(sessionRef, sessionData);
    }
  }

  clearUserSession() {
    if (this.currentUser?.sessionId) {
      this.sessionData.delete(this.currentUser.sessionId);
      
      // Remove from database
      if (this.isConfigured) {
        const sessionRef = ref(database, `sessions/${this.currentUser.uid}/${this.currentUser.sessionId}`);
        remove(sessionRef).catch(console.error);
      }
    }
  }

  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // Enhanced database operations
  async saveUserToDatabase(userData) {
    if (!this.isConfigured) return;

    try {
      const timestamp = new Date().toISOString();
      
      // Save to users collection
      const userRef = ref(database, `users/${userData.uid}`);
      await set(userRef, {
        ...userData,
        updatedAt: timestamp
      });
      
      // Save to admin collection with role info
      const adminRef = ref(database, `portfolio/admins/${userData.uid}`);
      await set(adminRef, {
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL,
        role: userData.role,
        permissions: userData.permissions,
        lastLogin: userData.lastLogin,
        isActive: true,
        deviceInfo: userData.deviceInfo
      });
      
      // Update login history
      const loginHistoryRef = ref(database, `loginHistory/${userData.uid}`);
      await push(loginHistoryRef, {
        timestamp,
        deviceInfo: userData.deviceInfo,
        method: userData.provider,
        sessionId: userData.sessionId
      });
      
      console.log('✅ User data saved to database');
      
    } catch (error) {
      console.error('Error saving user to database:', error);
    }
  }

  // Enhanced user activity logging
  async logUserActivity(action, userData, metadata = {}) {
    if (!this.isConfigured) return;

    try {
      const activityRef = ref(database, `userActivity/${userData.uid}`);
      await push(activityRef, {
        action,
        timestamp: new Date().toISOString(),
        sessionId: userData.sessionId,
        deviceInfo: this.deviceInfo,
        metadata
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  // Enhanced error handling
  handleAuthError(error) {
    console.error('Auth error:', error);
    
    // Log to analytics if available
    this.logAnalyticsEvent('auth_error', {
      error_code: error.code,
      error_message: error.message,
      device_type: this.deviceInfo.isMobile ? 'mobile' : 'desktop'
    });
    
    // Notify listeners
    this.notifyAuthStateListeners(null, { 
      error: this.createUserFriendlyError(error).message 
    });
  }

  // Enhanced analytics logging
  logAnalyticsEvent(eventName, parameters = {}) {
    if (analytics) {
      try {
        const enhancedParams = {
          ...parameters,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        logEvent(analytics, eventName, enhancedParams);
        console.log(`📊 Analytics: ${eventName}`, enhancedParams);
      } catch (error) {
        console.warn('Analytics logging failed:', error);
      }
    }
  }

  // Get comprehensive service status
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      initialized: this.isInitialized,
      authenticated: this.isAuthenticated(),
      adminEmails: ADMIN_CONFIG.emails,
      adminDomains: ADMIN_CONFIG.domains,
      signInMethod: this.signInMethod,
      deviceInfo: this.deviceInfo,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      sessionCount: this.sessionData.size,
      currentUser: this.currentUser ? {
        email: this.currentUser.email,
        name: this.currentUser.name,
        role: this.currentUser.role,
        permissions: this.currentUser.permissions,
        isAdmin: this.currentUser.isAdmin,
        provider: this.currentUser.provider,
        sessionId: this.currentUser.sessionId
      } : null
    };
  }

  // Additional utility methods
  getCurrentUser() { return this.currentUser; }
  isAuthenticated() { return !!this.currentUser; }
  isAdmin() { return this.currentUser?.isAdmin === true; }
  hasPermission(permission) { 
    return this.currentUser?.permissions?.includes(permission) || false; 
  }
  getUserRole() { return this.currentUser?.role || 'user'; }

  async getIdToken(forceRefresh = false) {
    if (!this.isConfigured) return 'mock-jwt-token';
    if (auth.currentUser) return await auth.currentUser.getIdToken(forceRefresh);
    return null;
  }

  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) this.authStateListeners.splice(index, 1);
    };
  }

  async waitForAuth() {
    if (!this.isConfigured) return this.currentUser;
    
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve(this.currentUser);
        return;
      }
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user && this.isAuthorizedUser(user.email) ? this.currentUser : null);
      });
    });
  }
}

// Create and export singleton instance
const modernGoogleAuthService = new ModernGoogleAuthService();
export default modernGoogleAuthService;

// Export individual functions for convenience
export const {
  signInWithGoogle,
  signInWithGoogleRedirect,
  signOut: signOutUser,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  hasPermission,
  getUserRole,
  getIdToken,
  onAuthStateChanged: onAuthStateChange,
  waitForAuth,
  getServiceStatus
} = modernGoogleAuthService;