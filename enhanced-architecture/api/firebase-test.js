// Firebase and JWT Testing API Endpoint
const firebaseService = require('../services/FirebaseServiceSecure');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    const urlPath = url.replace('/api/firebase-test', '') || '/';
    
    if (urlPath === '/health' && method === 'GET') {
      // Firebase health check
      const health = await firebaseService.healthCheck();
      
      res.status(200).json({
        success: true,
        data: health
      });
      
    } else if (urlPath === '/verify-token' && method === 'POST') {
      // JWT token verification test
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token is required'
          }
        });
      }

      try {
        const decodedToken = await firebaseService.verifyIdToken(token);
        
        res.status(200).json({
          success: true,
          data: {
            valid: true,
            user: decodedToken,
            message: 'Token verified successfully'
          }
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_VERIFICATION_FAILED',
            message: error.message
          }
        });
      }
      
    } else if (urlPath === '/test-auth' && method === 'GET') {
      // Test authentication middleware
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

      const token = authHeader.substring(7);
      
      try {
        const decodedToken = await firebaseService.verifyIdToken(token);
        
        res.status(200).json({
          success: true,
          data: {
            authenticated: true,
            user: decodedToken,
            message: 'Authentication successful'
          }
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: error.message
          }
        });
      }
      
    } else if (urlPath === '/test-database' && method === 'GET') {
      // Test database operations
      try {
        // Test write
        const testData = {
          timestamp: new Date().toISOString(),
          message: 'Firebase test from API',
          random: Math.random()
        };
        
        await firebaseService.writeData('test/api-test', testData);
        
        // Test read
        const readData = await firebaseService.readData('test/api-test');
        
        // Test update
        await firebaseService.updateData('test/api-test', {
          updated: true,
          updateTime: new Date().toISOString()
        });
        
        // Read updated data
        const updatedData = await firebaseService.readData('test/api-test');
        
        // Clean up
        await firebaseService.deleteData('test/api-test');
        
        res.status(200).json({
          success: true,
          data: {
            operations: ['write', 'read', 'update', 'delete'],
            originalData: readData,
            updatedData: updatedData,
            message: 'All database operations successful'
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_TEST_FAILED',
            message: error.message
          }
        });
      }
      
    } else if (urlPath === '/create-custom-token' && method === 'POST') {
      // Test custom token creation
      const { uid, claims } = req.body;
      
      if (!uid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'UID is required'
          }
        });
      }

      try {
        const customToken = await firebaseService.createCustomToken(uid, claims);
        
        res.status(200).json({
          success: true,
          data: {
            customToken,
            uid,
            claims,
            message: 'Custom token created successfully'
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CUSTOM_TOKEN_FAILED',
            message: error.message
          }
        });
      }
      
    } else if (urlPath === '/config-check' && method === 'GET') {
      // Check Firebase configuration
      const config = {
        hasCredentials: firebaseService.hasValidCredentials(),
        isInitialized: firebaseService.isInitialized,
        adminEmail: firebaseService.adminEmail,
        projectId: process.env.FIREBASE_PROJECT_ID || 'Not configured',
        databaseUrl: process.env.FIREBASE_DATABASE_URL || 'Not configured'
      };
      
      // Check environment variables
      const envVars = {
        server: {
          FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
          FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
          FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
          FIREBASE_DATABASE_URL: !!process.env.FIREBASE_DATABASE_URL,
          ADMIN_EMAIL: !!process.env.ADMIN_EMAIL
        },
        client: {
          VITE_FIREBASE_API_KEY: !!process.env.VITE_FIREBASE_API_KEY,
          VITE_FIREBASE_AUTH_DOMAIN: !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
          VITE_FIREBASE_PROJECT_ID: !!process.env.VITE_FIREBASE_PROJECT_ID,
          VITE_ADMIN_EMAIL: !!process.env.VITE_ADMIN_EMAIL
        }
      };
      
      res.status(200).json({
        success: true,
        data: {
          config,
          environmentVariables: envVars,
          recommendations: firebaseService.isInitialized 
            ? ['Firebase is properly configured and ready for production']
            : [
                'Configure Firebase environment variables',
                'Run firebase-verification.js to test setup',
                'Check .env and .env.local files'
              ]
        }
      });
      
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Firebase test endpoint not found'
        }
      });
    }
    
  } catch (error) {
    console.error('Firebase test API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process Firebase test request'
      }
    });
  }
};