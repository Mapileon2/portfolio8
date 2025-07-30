const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const NodeCache = require('node-cache');

class FirebaseService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
    this.app = null;
    this.auth = null;
    this.database = null;
    this.isInitialized = false;
    
    this.initialize();
  }

  initialize() {
    try {
      // Check if Firebase credentials are available
      if (!process.env.FIREBASE_PROJECT_ID || 
          !process.env.FIREBASE_PRIVATE_KEY || 
          process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_KEY') ||
          process.env.FIREBASE_PROJECT_ID === 'your-project-id') {
        console.log('🔧 Firebase credentials not configured, skipping initialization');
        this.isInitialized = false;
        return;
      }

      // Initialize Firebase Admin SDK with environment variables
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };

      // Only initialize if not already initialized
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      } else {
        this.app = admin.app();
      }

      this.auth = getAuth(this.app);
      this.database = getDatabase(this.app);
      this.isInitialized = true;
      
      console.log('🔥 Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      console.log('🔧 Running in development mode without Firebase');
      this.isInitialized = false;
    }
  }

  // Authentication methods
  async verifyIdToken(idToken) {
    if (!this.isInitialized) {
      // Development mode - mock token verification
      console.log('🔧 Dev Mode: Mock token verification');
      return {
        uid: 'dev-user-123',
        email: 'admin@example.com',
        emailVerified: true,
        customClaims: { admin: true }
      };
    }

    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        customClaims: decodedToken.customClaims || {}
      };
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Invalid token');
    }
  }

  async createUser(userData) {
    try {
      const userRecord = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: false
      });

      // Set custom claims if admin
      if (userData.isAdmin) {
        await this.setCustomClaims(userRecord.uid, { admin: true });
      }

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      };
    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  }

  async setCustomClaims(uid, claims) {
    try {
      await this.auth.setCustomUserClaims(uid, claims);
      console.log(`Custom claims set for user ${uid}`);
    } catch (error) {
      console.error('Set custom claims error:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const userRecord = await this.auth.getUserByEmail(email);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        customClaims: userRecord.customClaims || {}
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  // Database methods
  async getData(path) {
    if (!this.isInitialized) {
      // Development mode - return mock data
      console.log('🔧 Dev Mode: Mock getData for', path);
      const fs = require('fs');
      const pathModule = require('path');
      
      try {
        // Try to load from local data files
        const dataFile = pathModule.join(__dirname, '../data', `${path.replace('/', '')}.json`);
        if (fs.existsSync(dataFile)) {
          const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
          return data;
        }
      } catch (error) {
        console.log('No local data file found, returning mock data');
      }
      
      // Return mock data based on path
      if (path.includes('caseStudies')) {
        return {
          'sample-1': {
            id: 'sample-1',
            projectTitle: 'Sample Project',
            description: 'This is a sample project for development',
            createdAt: new Date().toISOString()
          }
        };
      }
      
      return null;
    }

    try {
      const cacheKey = `firebase_data:${path}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const snapshot = await this.database.ref(path).once('value');
      const data = snapshot.val();
      
      if (data) {
        this.cache.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`Error getting data from ${path}:`, error);
      throw error;
    }
  }

  async setData(path, data) {
    if (!this.isInitialized) {
      console.log('🔧 Dev Mode: Mock setData for', path);
      return true;
    }

    try {
      await this.database.ref(path).set(data);
      
      // Clear related cache
      this.cache.del(`firebase_data:${path}`);
      
      console.log(`Data set at ${path}`);
      return true;
    } catch (error) {
      console.error(`Error setting data at ${path}:`, error);
      throw error;
    }
  }

  async updateData(path, updates) {
    try {
      await this.database.ref(path).update(updates);
      
      // Clear related cache
      this.cache.del(`firebase_data:${path}`);
      
      console.log(`Data updated at ${path}`);
      return true;
    } catch (error) {
      console.error(`Error updating data at ${path}:`, error);
      throw error;
    }
  }

  async deleteData(path) {
    try {
      await this.database.ref(path).remove();
      
      // Clear related cache
      this.cache.del(`firebase_data:${path}`);
      
      console.log(`Data deleted at ${path}`);
      return true;
    } catch (error) {
      console.error(`Error deleting data at ${path}:`, error);
      throw error;
    }
  }

  async pushData(path, data) {
    try {
      const ref = await this.database.ref(path).push(data);
      
      // Clear related cache
      this.cache.del(`firebase_data:${path}`);
      
      console.log(`Data pushed to ${path} with key ${ref.key}`);
      return ref.key;
    } catch (error) {
      console.error(`Error pushing data to ${path}:`, error);
      throw error;
    }
  }

  // Portfolio-specific methods
  async getCaseStudies() {
    try {
      const caseStudies = await this.getData('caseStudies');
      if (!caseStudies) return [];
      
      // Convert to array and sort by creation date
      return Object.entries(caseStudies).map(([id, data]) => ({
        id,
        ...data
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting case studies:', error);
      return [];
    }
  }

  async createCaseStudy(caseStudyData) {
    try {
      const id = Date.now().toString();
      const data = {
        ...caseStudyData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.setData(`caseStudies/${id}`, data);
      return { id, ...data };
    } catch (error) {
      console.error('Error creating case study:', error);
      throw error;
    }
  }

  async updateCaseStudy(id, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.updateData(`caseStudies/${id}`, updateData);
      return true;
    } catch (error) {
      console.error('Error updating case study:', error);
      throw error;
    }
  }

  async deleteCaseStudy(id) {
    try {
      await this.deleteData(`caseStudies/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting case study:', error);
      throw error;
    }
  }

  async getCarouselImages() {
    try {
      const images = await this.getData('carouselImages');
      if (!images) return [];
      
      return Object.entries(images).map(([id, data]) => ({
        id,
        ...data
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting carousel images:', error);
      return [];
    }
  }

  async addCarouselImage(imageData) {
    try {
      const id = Date.now().toString();
      const data = {
        ...imageData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.setData(`carouselImages/${id}`, data);
      return { id, ...data };
    } catch (error) {
      console.error('Error adding carousel image:', error);
      throw error;
    }
  }

  async deleteCarouselImage(id) {
    try {
      await this.deleteData(`carouselImages/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      throw error;
    }
  }

  // Analytics integration
  async trackAnalyticsEvent(eventData) {
    try {
      const analyticsPath = 'analytics/events';
      await this.pushData(analyticsPath, {
        ...eventData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Security methods
  async logSecurityEvent(eventData) {
    try {
      const securityPath = 'security/logs';
      await this.pushData(securityPath, {
        ...eventData,
        timestamp: new Date().toISOString(),
        severity: eventData.severity || 'info'
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase not initialized');
      }

      // Test database connection
      await this.database.ref('.info/connected').once('value');
      
      return {
        status: 'healthy',
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cleanup
  async disconnect() {
    try {
      if (this.app) {
        await this.app.delete();
        this.isInitialized = false;
        console.log('Firebase connection closed');
      }
    } catch (error) {
      console.error('Error disconnecting Firebase:', error);
    }
  }
}

module.exports = FirebaseService;