const admin = require('firebase-admin');
const NodeCache = require('node-cache');

class FirebaseServiceSecure {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
    this.app = null;
    this.auth = null;
    this.database = null;
    this.isInitialized = false;
    this.adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
    
    this.initialize();
  }

  initialize() {
    try {
      // Check if Firebase credentials are available
      if (!this.hasValidCredentials()) {
        console.log('🔧 Firebase credentials not configured, using mock mode');
        this.isInitialized = false;
        return;
      }

      // Initialize Firebase Admin SDK
      const serviceAccount = this.buildServiceAccount();
      
      // Only initialize if not already initialized
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      } else {
        this.app = admin.app();
      }

      this.auth = admin.auth();
      this.database = admin.database();
      this.isInitialized = true;

      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log(`📋 Project: ${process.env.FIREBASE_PROJECT_ID}`);
      console.log(`📋 Admin Email: ${this.adminEmail}`);
      
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      this.isInitialized = false;
    }
  }

  hasValidCredentials() {
    const required = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_DATABASE_URL'
    ];

    return required.every(key => {
      const value = process.env[key];
      return value && 
             !value.includes('your-') && 
             !value.includes('YOUR_') &&
             value !== 'your-project-id';
    });
  }

  buildServiceAccount() {
    return {
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
  }

  // JWT Token Verification
  async verifyIdToken(idToken) {
    if (!this.isInitialized) {
      // Mock verification for development
      return this.mockTokenVerification(idToken);
    }

    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      
      // Verify admin access
      if (decodedToken.email !== this.adminEmail) {
        throw new Error(`Access denied. Only ${this.adminEmail} can access this resource.`);
      }

      // Add admin claim
      const userRecord = await this.auth.getUser(decodedToken.uid);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || userRecord.displayName,
        picture: decodedToken.picture || userRecord.photoURL,
        isAdmin: true,
        emailVerified: decodedToken.email_verified,
        authTime: decodedToken.auth_time,
        exp: decodedToken.exp,
        iat: decodedToken.iat
      };
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      throw new Error('Invalid or expired token');
    }
  }

  mockTokenVerification(idToken) {
    console.log('🔧 Using mock JWT verification');
    
    if (idToken === 'mock-jwt-token') {
      return {
        uid: 'mock-admin-uid',
        email: this.adminEmail,
        name: 'Admin User',
        picture: 'https://via.placeholder.com/100x100?text=Admin',
        isAdmin: true,
        emailVerified: true,
        authTime: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iat: Math.floor(Date.now() / 1000)
      };
    }
    
    throw new Error('Invalid mock token');
  }

  // Create custom token for user
  async createCustomToken(uid, additionalClaims = {}) {
    if (!this.isInitialized) {
      console.log('🔧 Mock custom token creation');
      return 'mock-custom-token-' + uid;
    }

    try {
      const customToken = await this.auth.createCustomToken(uid, {
        admin: true,
        email: this.adminEmail,
        ...additionalClaims
      });
      
      return customToken;
    } catch (error) {
      console.error('Custom token creation failed:', error.message);
      throw error;
    }
  }

  // Middleware for Express routes
  authenticateAdmin() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authorization header with Bearer token required'
            }
          });
        }

        const idToken = authHeader.substring(7);
        const decodedToken = await this.verifyIdToken(idToken);
        
        // Attach user info to request
        req.user = decodedToken;
        req.isAdmin = decodedToken.isAdmin;
        
        next();
      } catch (error) {
        console.error('Authentication middleware error:', error.message);
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: error.message
          }
        });
      }
    };
  }

  // Database operations with admin privileges
  async writeData(path, data) {
    if (!this.isInitialized) {
      console.log(`🔧 Mock write to ${path}:`, data);
      return { success: true, mock: true };
    }

    try {
      const ref = this.database.ref(path);
      await ref.set(data);
      return { success: true };
    } catch (error) {
      console.error(`Database write failed for ${path}:`, error.message);
      throw error;
    }
  }

  async readData(path) {
    if (!this.isInitialized) {
      console.log(`🔧 Mock read from ${path}`);
      return this.getMockData(path);
    }

    try {
      const cacheKey = `db_${path}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const ref = this.database.ref(path);
      const snapshot = await ref.once('value');
      const data = snapshot.val();
      
      if (data) {
        this.cache.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`Database read failed for ${path}:`, error.message);
      throw error;
    }
  }

  async updateData(path, updates) {
    if (!this.isInitialized) {
      console.log(`🔧 Mock update to ${path}:`, updates);
      return { success: true, mock: true };
    }

    try {
      const ref = this.database.ref(path);
      await ref.update(updates);
      
      // Clear cache for this path
      this.cache.del(`db_${path}`);
      
      return { success: true };
    } catch (error) {
      console.error(`Database update failed for ${path}:`, error.message);
      throw error;
    }
  }

  async deleteData(path) {
    if (!this.isInitialized) {
      console.log(`🔧 Mock delete from ${path}`);
      return { success: true, mock: true };
    }

    try {
      const ref = this.database.ref(path);
      await ref.remove();
      
      // Clear cache
      this.cache.del(`db_${path}`);
      
      return { success: true };
    } catch (error) {
      console.error(`Database delete failed for ${path}:`, error.message);
      throw error;
    }
  }

  // Get mock data for development
  getMockData(path) {
    const mockData = {
      'portfolio/case-studies': {
        'case-study-1': {
          id: 'case-study-1',
          projectTitle: 'E-commerce Platform',
          description: 'Modern e-commerce solution with React and Node.js',
          technologies: ['React', 'Node.js', 'MongoDB'],
          category: 'Web Development',
          status: 'published',
          featured: true,
          createdAt: new Date().toISOString()
        }
      },
      'portfolio/carousel-images': {
        'image-1': {
          id: 'image-1',
          url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
          alt: 'Portfolio showcase',
          caption: 'Featured project',
          order: 1,
          active: true
        }
      },
      'portfolio/sections': {
        hero: {
          title: 'Welcome to My Portfolio',
          subtitle: 'Full Stack Developer',
          description: 'Creating amazing web experiences'
        }
      }
    };

    return mockData[path] || null;
  }

  // Health check
  async healthCheck() {
    const status = {
      initialized: this.isInitialized,
      timestamp: new Date().toISOString(),
      adminEmail: this.adminEmail
    };

    if (this.isInitialized) {
      try {
        // Test database connection
        await this.database.ref('.info/connected').once('value');
        status.database = 'connected';
        
        // Test auth service
        await this.auth.listUsers(1);
        status.auth = 'connected';
        
      } catch (error) {
        status.error = error.message;
      }
    } else {
      status.mode = 'mock';
    }

    return status;
  }

  // Get database reference (for advanced operations)
  getRef(path) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - cannot get database reference');
    }
    return this.database.ref(path);
  }

  // Get auth instance (for advanced operations)
  getAuth() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - cannot get auth instance');
    }
    return this.auth;
  }
}

// Create and export singleton instance
const firebaseService = new FirebaseServiceSecure();
module.exports = firebaseService;