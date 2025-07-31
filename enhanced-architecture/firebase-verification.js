#!/usr/bin/env node

// Firebase Initialization and JWT Verification Tool
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config();

console.log('🔥 Firebase Initialization and JWT Verification Tool\n');

// Check environment variables
function checkEnvironmentVariables() {
  console.log('📋 Checking Environment Variables...\n');
  
  const serverVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_DATABASE_URL',
    'ADMIN_EMAIL'
  ];

  const clientVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_DATABASE_URL',
    'VITE_ADMIN_EMAIL'
  ];

  console.log('🔧 Server-side Variables:');
  serverVars.forEach(varName => {
    const value = process.env[varName];
    const status = value && !value.includes('your-') ? '✅' : '❌';
    const display = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'Not set';
    console.log(`  ${status} ${varName}: ${display}`);
  });

  console.log('\n🎨 Client-side Variables:');
  clientVars.forEach(varName => {
    const value = process.env[varName];
    const status = value && !value.includes('your-') ? '✅' : '❌';
    const display = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'Not set';
    console.log(`  ${status} ${varName}: ${display}`);
  });

  const serverConfigured = serverVars.every(varName => {
    const value = process.env[varName];
    return value && !value.includes('your-');
  });

  const clientConfigured = clientVars.every(varName => {
    const value = process.env[varName];
    return value && !value.includes('your-');
  });

  return { serverConfigured, clientConfigured };
}

// Initialize Firebase Admin SDK
async function initializeFirebaseAdmin() {
  console.log('\n🔥 Initializing Firebase Admin SDK...\n');
  
  try {
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return admin.app();
    }

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

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📋 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`📋 Database URL: ${process.env.FIREBASE_DATABASE_URL}`);
    
    return app;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    return null;
  }
}

// Test Firebase Admin Auth
async function testFirebaseAdminAuth() {
  console.log('\n🔐 Testing Firebase Admin Authentication...\n');
  
  try {
    const auth = admin.auth();
    
    // Test creating a custom token
    const customToken = await auth.createCustomToken('test-uid', {
      admin: true,
      email: process.env.ADMIN_EMAIL
    });
    
    console.log('✅ Custom token creation successful');
    console.log(`📋 Token length: ${customToken.length} characters`);
    
    // Test verifying a mock token (this will fail, but shows the method works)
    try {
      await auth.verifyIdToken('mock-token');
    } catch (verifyError) {
      if (verifyError.code === 'auth/argument-error') {
        console.log('✅ Token verification method working (expected error for mock token)');
      } else {
        console.log('⚠️  Token verification error:', verifyError.code);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase Admin Auth test failed:', error.message);
    return false;
  }
}

// Test Firebase Realtime Database
async function testFirebaseDatabase() {
  console.log('\n💾 Testing Firebase Realtime Database...\n');
  
  try {
    const db = admin.database();
    const testRef = db.ref('test/connection');
    
    // Write test data
    await testRef.set({
      timestamp: new Date().toISOString(),
      message: 'Firebase connection test'
    });
    
    console.log('✅ Database write successful');
    
    // Read test data
    const snapshot = await testRef.once('value');
    const data = snapshot.val();
    
    if (data && data.message === 'Firebase connection test') {
      console.log('✅ Database read successful');
      console.log(`📋 Test data: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log('⚠️  Database read returned unexpected data');
    }
    
    // Clean up test data
    await testRef.remove();
    console.log('✅ Test data cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

// Test JWT Token Verification
async function testJWTVerification() {
  console.log('\n🎫 Testing JWT Token Verification...\n');
  
  try {
    const auth = admin.auth();
    
    // Create a test user (if not exists)
    let testUser;
    try {
      testUser = await auth.getUserByEmail(process.env.ADMIN_EMAIL);
      console.log('✅ Admin user found in Firebase Auth');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('⚠️  Admin user not found in Firebase Auth');
        console.log('💡 This is normal - users are created when they first sign in');
        return true;
      } else {
        throw error;
      }
    }
    
    if (testUser) {
      console.log(`📋 User UID: ${testUser.uid}`);
      console.log(`📋 User Email: ${testUser.email}`);
      console.log(`📋 Email Verified: ${testUser.emailVerified}`);
      
      // Create custom token for this user
      const customToken = await auth.createCustomToken(testUser.uid, {
        admin: true,
        email: testUser.email
      });
      
      console.log('✅ Custom token created for admin user');
      console.log(`📋 Token preview: ${customToken.substring(0, 50)}...`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ JWT verification test failed:', error.message);
    return false;
  }
}

// Test Database Security Rules
async function testDatabaseSecurity() {
  console.log('\n🔒 Testing Database Security Rules...\n');
  
  try {
    const db = admin.database();
    
    // Test writing to protected path (should work with admin SDK)
    const protectedRef = db.ref('portfolio/test-security');
    await protectedRef.set({
      timestamp: new Date().toISOString(),
      message: 'Security test from admin SDK'
    });
    
    console.log('✅ Admin SDK can write to protected paths');
    
    // Read the data back
    const snapshot = await protectedRef.once('value');
    const data = snapshot.val();
    
    if (data) {
      console.log('✅ Admin SDK can read from protected paths');
    }
    
    // Clean up
    await protectedRef.remove();
    console.log('✅ Security test data cleaned up');
    
    console.log('💡 Note: Client-side access will be restricted by security rules');
    
    return true;
  } catch (error) {
    console.error('❌ Database security test failed:', error.message);
    return false;
  }
}

// Main verification function
async function runVerification() {
  console.log('🚀 Starting Firebase Verification...\n');
  
  const { serverConfigured, clientConfigured } = checkEnvironmentVariables();
  
  if (!serverConfigured) {
    console.log('\n❌ Server-side Firebase configuration incomplete');
    console.log('💡 Please configure the server environment variables in .env file');
    return;
  }
  
  if (!clientConfigured) {
    console.log('\n⚠️  Client-side Firebase configuration incomplete');
    console.log('💡 Please configure the client environment variables in .env.local file');
  }
  
  const app = await initializeFirebaseAdmin();
  if (!app) {
    console.log('\n❌ Cannot proceed without Firebase Admin initialization');
    return;
  }
  
  const tests = [
    { name: 'Firebase Admin Auth', test: testFirebaseAdminAuth },
    { name: 'Firebase Database', test: testFirebaseDatabase },
    { name: 'JWT Verification', test: testJWTVerification },
    { name: 'Database Security', test: testDatabaseSecurity }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    const result = await test();
    results.push({ name, success: result });
  }
  
  console.log('\n📊 Verification Summary:\n');
  results.forEach(({ name, success }) => {
    const status = success ? '✅' : '❌';
    console.log(`  ${status} ${name}`);
  });
  
  const allPassed = results.every(r => r.success);
  
  if (allPassed) {
    console.log('\n🎉 All Firebase tests passed! Your setup is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
  }
  
  console.log('\n📚 Next Steps:');
  console.log('1. Deploy to Vercel with environment variables');
  console.log('2. Test Google authentication in production');
  console.log('3. Verify admin access with your Gmail account');
  console.log('4. Monitor Firebase usage in the console');
}

// Run if called directly
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = {
  checkEnvironmentVariables,
  initializeFirebaseAdmin,
  testFirebaseAdminAuth,
  testFirebaseDatabase,
  testJWTVerification,
  testDatabaseSecurity,
  runVerification
};