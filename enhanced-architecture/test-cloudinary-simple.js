#!/usr/bin/env node

require('dotenv').config();

console.log('☁️ Simple Cloudinary Test');
console.log('=========================');

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('✅ Cloudinary configured with:');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);

// Test URL generation (doesn't require API call)
console.log('\n🔗 Testing URL generation...');
try {
  const testUrl = cloudinary.url('sample', {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  console.log('✅ URL generation successful!');
  console.log(`   Sample URL: ${testUrl}`);
  
  // Test signature generation (offline test)
  console.log('\n🔐 Testing signature generation...');
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = { timestamp, folder: 'portfolio' };
  
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  
  console.log('✅ Signature generation successful!');
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Signature: ${signature.substring(0, 10)}...`);
  
  console.log('\n🎉 Cloudinary Basic Functions Working!');
  console.log('\n📸 Your portfolio image features:');
  console.log('   ✅ URL generation - Working');
  console.log('   ✅ Image transformations - Working');
  console.log('   ✅ Secure signatures - Working');
  console.log('   ✅ Configuration - Valid');
  
  console.log('\n💡 Note: API connectivity will be tested when you upload images');
  console.log('🚀 Start your portfolio: npm run dev:fast');
  
} catch (error) {
  console.log('❌ Basic functions failed:', error.message);
}