require('dotenv').config({ path: './backend.env' });

// Test Cloudinary Connection
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary Configuration:');
console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('- API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Present' : '❌ Missing');
console.log('- API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Present' : '❌ Missing');

// Test Cloudinary Connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary Connection Successful:', result.status);
  })
  .catch(error => {
    console.error('❌ Cloudinary Connection Failed:', error.message);
  });

// Test Firebase Connection
console.log('\nFirebase Configuration:');
console.log('- Database URL:', process.env.FIREBASE_DATABASE_URL || '❌ Missing');

// Check if database URL is properly structured
if (process.env.FIREBASE_DATABASE_URL) {
  const urlPattern = /^https:\/\/[\w-]+(-[a-z0-9]+)?\.firebaseio\.com$/;
  const isValidUrl = urlPattern.test(process.env.FIREBASE_DATABASE_URL);
  
  if (isValidUrl) {
    console.log('✅ Firebase URL format is valid');
  } else {
    console.log('❌ Firebase URL format is invalid');
  }
}

// Note: We're not testing actual Firebase connection as the module is not installed
console.log('\nNote: Run "npm install firebase" to enable Firebase connection testing'); 