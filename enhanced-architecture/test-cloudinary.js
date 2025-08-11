#!/usr/bin/env node

require('dotenv').config();

console.log('☁️ Cloudinary Service Test');
console.log('==========================');

// Check environment variables
console.log('📋 Configuration Check:');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not Set'}`);
console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not Set'}`);

// Check if using placeholder values
const isPlaceholder = process.env.CLOUDINARY_CLOUD_NAME === 'your-new-cloud-name' ||
                     process.env.CLOUDINARY_API_KEY === 'your-new-api-key' ||
                     process.env.CLOUDINARY_API_SECRET === 'your-new-api-secret';

if (isPlaceholder) {
  console.log('');
  console.log('⚠️ Using Placeholder Credentials');
  console.log('');
  console.log('🔧 Setup Required:');
  console.log('   1. Go to https://cloudinary.com/');
  console.log('   2. Sign up or login to your account');
  console.log('   3. Go to Dashboard');
  console.log('   4. Copy your credentials:');
  console.log('      - Cloud Name');
  console.log('      - API Key');
  console.log('      - API Secret');
  console.log('   5. Update your .env file with actual values');
  console.log('');
  console.log('💡 Your portfolio will work with mock image uploads until configured');
  process.exit(0);
}

// Test Cloudinary connection
try {
  const CloudinaryService = require('./services/CloudinaryService');
  const cloudinary = new CloudinaryService();
  
  console.log('');
  console.log('🔍 Testing Cloudinary Connection...');
  
  cloudinary.healthCheck().then(result => {
    console.log('');
    if (result.status === 'healthy') {
      console.log('✅ Cloudinary Connection Successful!');
      console.log(`   Cloud Name: ${result.cloudName}`);
      console.log(`   Status: ${result.status}`);
      console.log('');
      console.log('🎉 Your portfolio now has professional image management!');
      console.log('');
      console.log('📸 Features Available:');
      console.log('   ✅ Image upload and optimization');
      console.log('   ✅ Automatic thumbnail generation');
      console.log('   ✅ CDN delivery for fast loading');
      console.log('   ✅ Responsive image serving');
      console.log('   ✅ Portfolio-specific organization');
      console.log('');
      console.log('🚀 Start your portfolio: npm run dev:fast');
    } else {
      console.log('❌ Cloudinary Connection Failed');
      console.log(`   Error: ${result.error}`);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Verify your credentials are correct');
      console.log('   2. Check your Cloudinary account status');
      console.log('   3. Ensure API access is enabled');
    }
  }).catch(error => {
    console.log('❌ Cloudinary Test Failed');
    console.log(`   Error: ${error.message}`);
    console.log('');
    console.log('💡 Your portfolio will work with mock uploads until configured');
  });
  
} catch (error) {
  console.log('❌ Cloudinary Service Error');
  console.log(`   Error: ${error.message}`);
  console.log('');
  console.log('💡 Your portfolio will work with mock uploads until configured');
}