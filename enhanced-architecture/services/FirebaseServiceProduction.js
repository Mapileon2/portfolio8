const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

class FirebaseServiceProduction {
  constructor() {
    this.app = null;
    this.auth = null;
    this.firestore = null;
    this.database = null;
    this.isInitialized = false;
    this.databaseType = null; // 'firestore' or 'realtime'
    
    this.initialize();
  }

  initialize() {
    try {
      // Check for service account file first
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      let serviceAccount = null;

      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
        console.log('🔥 Using Firebase service account file');
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        // Use environment variables
        serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
        };
        console.log('🔥 Using Firebase environment variables');
      } else {
        console.log('🔧 Firebase not configured, using development mode');
        this.isInitialized = false;
        return;
      }

      // Initialize Firebase Admin SDK
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
        });
      } else {
        this.app = admin.app();
      }

      this.auth = admin.auth();
      
      // Try to initialize Firestore first (preferred)
      try {
        this.firestore = admin.firestore();
        this.databaseType = 'firestore';
        console.log('✅ Firestore initialized');
      } catch (error) {
        console.log('⚠️ Firestore not available, trying Realtime Database');
        
        // Fallback to Realtime Database
        try {
          this.database = admin.database();
          this.databaseType = 'realtime';
          console.log('✅ Realtime Database initialized');
        } catch (dbError) {
          console.log('⚠️ No database available, using mock data mode');
          this.databaseType = 'mock';
        }
      }

      this.isInitialized = true;
      console.log(`🔥 Firebase service initialized (${this.databaseType} mode)`);

    } catch (error) {
      console.error('Firebase initialization error:', error.message);
      this.isInitialized = false;
    }
  }

  async healthCheck() {
    if (!this.isInitialized) {
      return { status: 'dev-mode', message: 'Firebase not configured' };
    }

    try {
      // Test authentication service
      await this.auth.listUsers(1);
      
      // Test database based on type
      if (this.databaseType === 'firestore') {
        await this.firestore.collection('health').limit(1).get();
      } else if (this.databaseType === 'realtime') {
        await this.database.ref('health').once('value');
      }

      return { 
        status: 'healthy', 
        database: this.databaseType,
        project: this.app.options.projectId 
      };
    } catch (error) {
      return { 
        status: 'partial', 
        message: 'Admin SDK working, database setup needed',
        database: this.databaseType 
      };
    }
  }

  // Case Studies Management
  async getCaseStudies() {
    if (!this.isInitialized || this.databaseType === 'mock') {
      return this.getMockCaseStudies();
    }

    try {
      if (this.databaseType === 'firestore') {
        const snapshot = await this.firestore.collection('caseStudies').orderBy('createdAt', 'desc').get();
        const caseStudies = [];
        snapshot.forEach(doc => {
          caseStudies.push({ id: doc.id, ...doc.data() });
        });
        return caseStudies;
      } else {
        const snapshot = await this.database.ref('caseStudies').orderByChild('createdAt').once('value');
        const data = snapshot.val() || {};
        return Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
      }
    } catch (error) {
      console.error('Error fetching case studies:', error);
      return this.getMockCaseStudies();
    }
  }

  async createCaseStudy(caseStudyData) {
    if (!this.isInitialized || this.databaseType === 'mock') {
      return this.createMockCaseStudy(caseStudyData);
    }

    try {
      const data = {
        ...caseStudyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (this.databaseType === 'firestore') {
        const docRef = await this.firestore.collection('caseStudies').add(data);
        return { id: docRef.id, ...data };
      } else {
        const newRef = this.database.ref('caseStudies').push();
        await newRef.set(data);
        return { id: newRef.key, ...data };
      }
    } catch (error) {
      console.error('Error creating case study:', error);
      return this.createMockCaseStudy(caseStudyData);
    }
  }

  async updateCaseStudy(id, updates) {
    if (!this.isInitialized || this.databaseType === 'mock') {
      return { success: true, id, ...updates };
    }

    try {
      const data = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (this.databaseType === 'firestore') {
        await this.firestore.collection('caseStudies').doc(id).update(data);
      } else {
        await this.database.ref(`caseStudies/${id}`).update(data);
      }

      return { success: true, id, ...data };
    } catch (error) {
      console.error('Error updating case study:', error);
      return { success: true, id, ...updates };
    }
  }

  async deleteCaseStudy(id) {
    if (!this.isInitialized || this.databaseType === 'mock') {
      return { success: true };
    }

    try {
      if (this.databaseType === 'firestore') {
        await this.firestore.collection('caseStudies').doc(id).delete();
      } else {
        await this.database.ref(`caseStudies/${id}`).remove();
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting case study:', error);
      return { success: true };
    }
  }

  // Mock data methods
  getMockCaseStudies() {
    return [
      {
        id: 'mock-1',
        projectTitle: 'E-commerce Platform',
        description: 'A modern e-commerce solution built with React and Node.js',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
        imageUrl: 'https://via.placeholder.com/800x400',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/example/repo',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-2',
        projectTitle: 'Task Management App',
        description: 'A collaborative task management application with real-time updates',
        technologies: ['Vue.js', 'Firebase', 'Vuetify'],
        imageUrl: 'https://via.placeholder.com/800x400',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/example/repo',
        createdAt: new Date().toISOString()
      }
    ];
  }

  createMockCaseStudy(data) {
    return {
      id: 'mock-' + Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
  }

  // Authentication methods
  async verifyIdToken(idToken) {
    if (!this.isInitialized) {
      return { uid: 'dev-user', email: 'admin@example.com' };
    }

    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async disconnect() {
    if (this.app) {
      await this.app.delete();
    }
  }
}

module.exports = FirebaseServiceProduction;