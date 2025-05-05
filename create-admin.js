const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get the absolute path to the service account file
const serviceAccountPath = path.resolve('./projectportfolio-29467-firebase-adminsdk-fbsvc-2b514f55ed.json');
console.log('Service account path:', serviceAccountPath);

try {
  // Load the service account file
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase admin initialized');

  // List users (limited to 100)
  console.log('Listing existing users...');
  
  admin.auth().listUsers(100)
    .then((listUsersResult) => {
      console.log('Users:');
      listUsersResult.users.forEach((userRecord) => {
        console.log('  - User ID:', userRecord.uid);
        console.log('    Email:', userRecord.email);
        console.log('    Email verified:', userRecord.emailVerified);
        console.log('    Disabled:', userRecord.disabled);
        console.log('');
      });
      
      console.log(`Total users: ${listUsersResult.users.length}`);
      
      // Admin user already exists with email admin@example.com
      // Use this email and password 'securePassword123' to log in
      console.log('\nLogin credentials:');
      console.log('Email: admin@example.com');
      console.log('Password: securePassword123');
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error listing users:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Error during initialization:', error);
  process.exit(1);
} 