/**
 * This script fixes CORS settings for Firebase Storage
 * Run with: node fix-storage-cors.js
 */
const admin = require('firebase-admin');
const fs = require('fs');

// Load the service account key
const serviceAccount = require('./projectportfolio-29467-firebase-adminsdk-fbsvc-2b514f55ed.json');

// Initialize Firebase Admin with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'projectportfolio-29467.firebasestorage.app'
});

// Get the storage service and bucket
const bucket = admin.storage().bucket();

console.log('Configuring CORS settings for Firebase Storage...');

// Define the CORS configuration
const corsConfiguration = [
  {
    origin: ['*'],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'User-Agent',
      'x-goog-resumable'
    ],
    maxAgeSeconds: 3600
  }
];

// Apply the CORS configuration to the bucket
bucket.setCorsConfiguration(corsConfiguration)
  .then(() => {
    console.log('CORS configuration was successfully updated');
    console.log('Storage bucket now allows requests from: *');
    
    // Additionally, write this configuration to a local file for reference
    fs.writeFileSync('cors-applied.json', JSON.stringify(corsConfiguration, null, 2));
    console.log('CORS configuration saved to cors-applied.json');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error updating CORS configuration:', err);
    
    // If the error is permission-related, we'll provide more guidance
    if (err.message && err.message.includes('permission')) {
      console.error('\nThis appears to be a permissions issue. Make sure:');
      console.error(' 1. Your service account has the Storage Admin role');
      console.error(' 2. The Firebase Storage service is activated for this project');
      console.error(' 3. Visit: https://console.firebase.google.com/project/projectportfolio-29467/storage');
      console.error(' 4. The Storage bucket actually exists');
    }
    
    process.exit(1);
  }); 