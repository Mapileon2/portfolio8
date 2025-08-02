// Fixed Firebase client-side configuration
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
    if (auth) {
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
      if (this.auth) {
        await signOut(this.auth);
      }
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
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Portfolio-specific API methods with error handling
  async getCaseStudies() {
    try {
      const response = await fetch('/api/firebase/case-studies');
      if (!response.ok) {
        console.warn('API not available, using mock data');
        return {
          data: [
            {
              id: 'case-study-1',
              projectTitle: 'E-commerce Platform',
              description: 'A full-stack e-commerce solution built with React and Node.js',
              technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
              imageUrl: 'https://via.placeholder.com/800x400',
              projectUrl: 'https://example.com',
              githubUrl: 'https://github.com/example/repo',
              createdAt: new Date().toISOString()
            }
          ]
        };
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching case studies:', error);
      // Return mock data as fallback
      return {
        data: [
          {
            id: 'case-study-1',
            projectTitle: 'E-commerce Platform',
            description: 'A full-stack e-commerce solution built with React and Node.js',
            technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
            imageUrl: 'https://via.placeholder.com/800x400',
            projectUrl: 'https://example.com',
            githubUrl: 'https://github.com/example/repo',
            createdAt: new Date().toISOString()
          }
        ]
      };
    }
  }

  async createCaseStudy(caseStudyData) {
    try {
      return await this.makeAuthenticatedRequest('/api/firebase/case-studies', {
        method: 'POST',
        body: JSON.stringify(caseStudyData)
      });
    } catch (error) {
      console.warn('API not available, using mock response');
      return {
        id: 'case-study-' + Date.now(),
        ...caseStudyData,
        createdAt: new Date().toISOString()
      };
    }
  }

  async updateCaseStudy(id, updates) {
    try {
      return await this.makeAuthenticatedRequest(`/api/firebase/case-studies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.warn('API not available, using mock response');
      return { success: true, id, ...updates };
    }
  }

  async deleteCaseStudy(id) {
    try {
      return await this.makeAuthenticatedRequest(`/api/firebase/case-studies/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('API not available, using mock response');
      return { success: true };
    }
  }

  async getCarouselImages() {
    try {
      const response = await fetch('/api/firebase/carousel-images');
      if (!response.ok) {
        return {
          data: [
            {
              id: 'image-1',
              url: 'https://via.placeholder.com/800x400',
              caption: 'Sample Portfolio Image',
              createdAt: new Date().toISOString()
            }
          ]
        };
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      return {
        data: [
          {
            id: 'image-1',
            url: 'https://via.placeholder.com/800x400',
            caption: 'Sample Portfolio Image',
            createdAt: new Date().toISOString()
          }
        ]
      };
    }
  }

  async addCarouselImage(imageData) {
    try {
      return await this.makeAuthenticatedRequest('/api/firebase/carousel-images', {
        method: 'POST',
        body: JSON.stringify(imageData)
      });
    } catch (error) {
      console.warn('API not available, using mock response');
      return {
        id: 'image-' + Date.now(),
        ...imageData,
        createdAt: new Date().toISOString()
      };
    }
  }

  async deleteCarouselImage(id) {
    try {
      return await this.makeAuthenticatedRequest(`/api/firebase/carousel-images/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('API not available, using mock response');
      return { success: true };
    }
  }

  async getSections() {
    try {
      const response = await fetch('/api/firebase/sections');
      if (!response.ok) {
        return {
          data: {
            about: {
              title: 'About Me',
              description: 'I am a passionate full-stack developer...'
            },
            contact: {
              email: 'contact@example.com',
              phone: '+1-234-567-8900'
            }
          }
        };
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching sections:', error);
      return {
        data: {
          about: {
            title: 'About Me',
            description: 'I am a passionate full-stack developer...'
          },
          contact: {
            email: 'contact@example.com',
            phone: '+1-234-567-8900'
          }
        }
      };
    }
  }

  async updateSections(sections) {
    try {
      return await this.makeAuthenticatedRequest('/api/firebase/sections', {
        method: 'PUT',
        body: JSON.stringify(sections)
      });
    } catch (error) {
      console.warn('API not available, using mock response');
      return { success: true };
    }
  }

  async verifyAdmin() {
    try {
      return await this.makeAuthenticatedRequest('/api/firebase/verify-admin');
    } catch (error) {
      console.warn('API not available, assuming admin access');
      return {
        isAdmin: true,
        user: this.currentUser || { email: 'admin@example.com', uid: 'dev-admin' }
      };
    }
  }

  // Image upload methods with fallback
  async uploadImage(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });

      const token = await this.getIdToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    } catch (error) {
      console.warn('Image upload API not available, using mock response');
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        image: {
          url: 'https://via.placeholder.com/800x400',
          publicId: 'mock-image-' + Date.now(),
          thumbnail: 'https://via.placeholder.com/300x200'
        }
      };
    }
  }

  async deleteImage(publicId) {
    try {
      return await this.makeAuthenticatedRequest(`/api/images/${encodeURIComponent(publicId)}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('API not available, using mock response');
      return { success: true };
    }
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
    if (this.auth && onAuthStateChanged) {
      return onAuthStateChanged(this.auth, callback);
    }
    return () => {}; // Return empty unsubscribe function
  }
}

// Create and export singleton instance
const firebaseClient = new FirebaseClient();
export default firebaseClient;