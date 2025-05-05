/**
 * Authentication Utility for the Portfolio Manager
 * This file provides utilities to handle authentication with Firebase
 * and interact with the protected API
 */

// Initialize Firebase Authentication
const initAuth = () => {
  // Check if Firebase is already initialized
  if (!window.firebase || !window.firebase.auth) {
    console.error('Firebase is not loaded. Load Firebase Auth before using this utility.');
    return false;
  }
  return true;
};

const AuthClient = {
  // Current user state
  currentUser: null,
  token: null,
  
  /**
   * Login with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} User information
   */
  async login(email, password) {
    if (!initAuth()) return null;
    
    try {
      // First try direct Firebase authentication
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        this.currentUser = userCredential.user;
        this.token = await userCredential.user.getIdToken();
        
        // Save token to localStorage
        localStorage.setItem('firebase_token', this.token);
        
        return {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          token: this.token
        };
      } catch (firebaseError) {
        console.error('Firebase auth error:', firebaseError);
        
        // Fall back to the server API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Login failed');
        }
        
        const data = await response.json();
        
        // Save token to localStorage
        localStorage.setItem('firebase_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Sign in to Firebase with custom token if provided
        if (data.token) {
          await firebase.auth().signInWithCustomToken(data.token);
          this.currentUser = firebase.auth().currentUser;
          this.token = data.token;
        }
        
        return {
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.name,
          token: data.token
        };
      }
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  },
  
  /**
   * Logout the current user
   * @returns {Promise<void>}
   */
  async logout() {
    if (!initAuth()) return;
    
    try {
      await firebase.auth().signOut();
      this.currentUser = null;
      this.token = null;
      localStorage.removeItem('firebase_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Logout error:', error.message);
      throw error;
    }
  },
  
  /**
   * Check if a user is currently logged in
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    if (!initAuth()) return false;
    
    return new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        unsubscribe();
        if (user) {
          this.currentUser = user;
          this.token = await user.getIdToken();
          resolve(true);
        } else {
          // Check if we have a stored token
          const storedToken = localStorage.getItem('firebase_token');
          if (storedToken) {
            try {
              // Try to sign in with the stored token
              await firebase.auth().signInWithCustomToken(storedToken);
              this.currentUser = firebase.auth().currentUser;
              this.token = storedToken;
              resolve(true);
              return;
            } catch (error) {
              console.error('Token sign-in error:', error);
              localStorage.removeItem('firebase_token');
              localStorage.removeItem('user_data');
            }
          }
          
          this.currentUser = null;
          this.token = null;
          resolve(false);
        }
      });
    });
  },
  
  /**
   * Get the current user's ID token for API requests
   * @returns {Promise<string|null>} ID token or null if not logged in
   */
  async getIdToken() {
    if (!initAuth()) return null;
    
    if (!this.currentUser) {
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) return null;
    }
    
    try {
      // Refresh the token to ensure it's valid
      this.token = await this.currentUser.getIdToken(true);
      return this.token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },
  
  /**
   * Make an authenticated API request
   * @param {string} url API endpoint URL
   * @param {Object} options Fetch options
   * @returns {Promise<Object>} Response data
   */
  async authFetch(url, options = {}) {
    const token = await this.getIdToken();
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Auth fetch error:', error);
      throw error;
    }
  },
  
  /**
   * Protected API methods - these require authentication
   */
  api: {
    // Projects
    async createProject(projectData) {
      return AuthClient.authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
    },
    
    async updateProject(id, updates) {
      return AuthClient.authFetch(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    
    async deleteProject(id) {
      return AuthClient.authFetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
    },
    
    // Case Studies
    async createCaseStudy(caseStudyData) {
      return AuthClient.authFetch('/api/case-studies', {
        method: 'POST',
        body: JSON.stringify(caseStudyData)
      });
    },
    
    async updateCaseStudy(id, updates) {
      return AuthClient.authFetch(`/api/case-studies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    
    async deleteCaseStudy(id) {
      return AuthClient.authFetch(`/api/case-studies/${id}`, {
        method: 'DELETE'
      });
    },
    
    // Sections
    async updateSections(sectionsData) {
      return AuthClient.authFetch('/api/sections', {
        method: 'PUT',
        body: JSON.stringify(sectionsData)
      });
    },
    
    // Carousel Images
    async createCarouselImage(imageData) {
      return AuthClient.authFetch('/api/carousel-images', {
        method: 'POST',
        body: JSON.stringify(imageData)
      });
    },
    
    async updateCarouselImage(id, updates) {
      return AuthClient.authFetch(`/api/carousel-images/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    
    async deleteCarouselImage(id) {
      return AuthClient.authFetch(`/api/carousel-images/${id}`, {
        method: 'DELETE'
      });
    }
  }
};

// Export the AuthClient
if (typeof window !== 'undefined') {
  window.AuthClient = AuthClient;
}

// For module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthClient;
}

// Example usage:
/*
// Login
AuthClient.login('admin@example.com', 'password123')
  .then(user => {
    console.log('Logged in as:', user.email);
    return AuthClient.api.createProject({
      title: 'New Project',
      description: 'Project created via the authenticated API'
    });
  })
  .then(newProject => {
    console.log('Created project:', newProject);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
*/ 