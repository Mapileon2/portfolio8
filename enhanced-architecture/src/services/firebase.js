// Firebase client-side configuration (secure)
import firebaseDevClient from './firebase-dev.js';

// Check if Firebase config is available
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Use dev client if Firebase config is missing
const isDevMode = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-public-api-key';

if (isDevMode) {
  console.log('🔧 Running in development mode - using mock Firebase client');
  export default firebaseDevClient;
}

// Production Firebase setup
let app, auth;
try {
  const { initializeApp } = await import('firebase/app');
  const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = await import('firebase/auth');
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  console.log('🔥 Firebase initialized with project:', firebaseConfig.projectId);
} catch (error) {
  console.warn('Firebase initialization failed, falling back to dev mode:', error);
  export default firebaseDevClient;
}

class FirebaseClient {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.idToken = null;
    
    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        // Get ID token for API calls
        user.getIdToken().then(token => {
          this.idToken = token;
        });
      } else {
        this.idToken = null;
      }
    });
  }

  // Authentication methods
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Get ID token
      this.idToken = await user.getIdToken();
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.idToken = null;
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get ID token for API calls
  async getIdToken() {
    if (this.currentUser) {
      return await this.currentUser.getIdToken();
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // API helper methods
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
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Portfolio-specific API methods (using mock data for now)
  async getCaseStudies() {
    try {
      // For now, return mock data since we don't have server-side Firebase setup
      return {
        caseStudies: [
          {
            id: 'case-study-1',
            projectTitle: 'E-commerce Platform',
            description: 'A full-stack e-commerce solution built with React and Node.js',
            technologies: 'React, Node.js, MongoDB, Express',
            createdAt: new Date().toISOString()
          },
          {
            id: 'case-study-2',
            projectTitle: 'Task Management App',
            description: 'A collaborative task management application with real-time updates',
            technologies: 'Vue.js, Firebase, Vuetify',
            createdAt: new Date().toISOString()
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching case studies:', error);
      throw error;
    }
  }

  async createCaseStudy(caseStudyData) {
    console.log('Creating case study:', caseStudyData);
    return {
      id: 'case-study-' + Date.now(),
      ...caseStudyData,
      createdAt: new Date().toISOString()
    };
  }

  async updateCaseStudy(id, updates) {
    console.log('Updating case study:', id, updates);
    return { success: true };
  }

  async deleteCaseStudy(id) {
    console.log('Deleting case study:', id);
    return { success: true };
  }

  async getCarouselImages() {
    return {
      images: [
        {
          id: 'image-1',
          url: 'https://via.placeholder.com/800x400',
          caption: 'Sample Portfolio Image',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  async addCarouselImage(imageData) {
    console.log('Adding carousel image:', imageData);
    return {
      id: 'image-' + Date.now(),
      ...imageData,
      createdAt: new Date().toISOString()
    };
  }

  async deleteCarouselImage(id) {
    console.log('Deleting carousel image:', id);
    return { success: true };
  }

  async getSections() {
    return {
      about: {
        title: 'About Me',
        description: 'I am a passionate full-stack developer...'
      },
      contact: {
        email: 'contact@example.com',
        phone: '+1-234-567-8900'
      }
    };
  }

  async updateSections(sections) {
    console.log('Updating sections:', sections);
    return { success: true };
  }

  async verifyAdmin() {
    // For now, assume any authenticated user is admin
    return {
      isAdmin: this.isAuthenticated(),
      user: this.currentUser
    };
  }

  async uploadImage(file, options = {}) {
    console.log('Mock image upload:', file.name, options);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      image: {
        url: 'https://via.placeholder.com/800x400',
        publicId: 'mock-image-' + Date.now(),
        thumbnail: 'https://via.placeholder.com/300x200'
      }
    };
  }

  async deleteImage(publicId) {
    console.log('Mock image delete:', publicId);
    return { success: true };
  }

  // Error handling
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'Invalid email or password.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  // Auth state listener
  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, callback);
  }
}

// Create and export singleton instance
const firebaseClient = new FirebaseClient();
export default firebaseClient;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

class FirebaseClient {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.idToken = null;
    
    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        // Get ID token for API calls
        user.getIdToken().then(token => {
          this.idToken = token;
        });
      } else {
        this.idToken = null;
      }
    });
  }

  // Authentication methods
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Get ID token
      this.idToken = await user.getIdToken();
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.idToken = null;
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get ID token for API calls
  async getIdToken() {
    if (this.currentUser) {
      return await this.currentUser.getIdToken();
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // API helper methods
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
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Portfolio-specific API methods
  async getCaseStudies() {
    try {
      const response = await fetch('/api/firebase/case-studies');
      if (!response.ok) throw new Error('Failed to fetch case studies');
      return response.json();
    } catch (error) {
      console.error('Error fetching case studies:', error);
      throw error;
    }
  }

  async getCaseStudy(id) {
    try {
      const response = await fetch(`/api/firebase/case-studies/${id}`);
      if (!response.ok) throw new Error('Failed to fetch case study');
      return response.json();
    } catch (error) {
      console.error('Error fetching case study:', error);
      throw error;
    }
  }

  async createCaseStudy(caseStudyData) {
    return this.makeAuthenticatedRequest('/api/firebase/case-studies', {
      method: 'POST',
      body: JSON.stringify(caseStudyData)
    });
  }

  async updateCaseStudy(id, updates) {
    return this.makeAuthenticatedRequest(`/api/firebase/case-studies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteCaseStudy(id) {
    return this.makeAuthenticatedRequest(`/api/firebase/case-studies/${id}`, {
      method: 'DELETE'
    });
  }

  async getCarouselImages() {
    try {
      const response = await fetch('/api/firebase/carousel-images');
      if (!response.ok) throw new Error('Failed to fetch carousel images');
      return response.json();
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      throw error;
    }
  }

  async addCarouselImage(imageData) {
    return this.makeAuthenticatedRequest('/api/firebase/carousel-images', {
      method: 'POST',
      body: JSON.stringify(imageData)
    });
  }

  async deleteCarouselImage(id) {
    return this.makeAuthenticatedRequest(`/api/firebase/carousel-images/${id}`, {
      method: 'DELETE'
    });
  }

  async getSections() {
    try {
      const response = await fetch('/api/firebase/sections');
      if (!response.ok) throw new Error('Failed to fetch sections');
      return response.json();
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  }

  async updateSections(sections) {
    return this.makeAuthenticatedRequest('/api/firebase/sections', {
      method: 'PUT',
      body: JSON.stringify(sections)
    });
  }

  async verifyAdmin() {
    return this.makeAuthenticatedRequest('/api/firebase/verify-admin');
  }

  // Image upload methods
  async uploadImage(file, options = {}) {
    const formData = new FormData();
    formData.append('image', file);
    
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const token = await this.getIdToken();
    const response = await fetch('/api/images/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async getUploadSignature(folder = 'portfolio') {
    return this.makeAuthenticatedRequest(`/api/images/upload-signature?folder=${folder}`);
  }

  async deleteImage(publicId) {
    return this.makeAuthenticatedRequest(`/api/images/${encodeURIComponent(publicId)}`, {
      method: 'DELETE'
    });
  }

  // Error handling
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'Invalid email or password.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  // Auth state listener
  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, callback);
  }
}

// Create and export singleton instance
const firebaseClient = new FirebaseClient();
export default firebaseClient;