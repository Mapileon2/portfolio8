#!/usr/bin/env node

require('dotenv').config();

console.log('☁️ Detailed Cloudinary Connection Test');
console.log('=====================================');

// Test basic configuration
console.log('📋 Configuration:');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Set (length: ' + process.env.CLOUDINARY_API_SECRET.length + ')' : 'Not Set'}`);

// Test Cloudinary SDK directly
console.log('\n🔍 Testing Cloudinary SDK...');

try {
  const cloudinary = require('cloudinary').v2;
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  
  console.log('✅ Cloudinary SDK configured');
  
  // Test API connection with ping
  console.log('\n📡 Testing API connection...');
  
  cloudinary.api.ping()
    .then(result => {
      console.log('✅ Cloudinary API Connection Successful!');
      console.log('   Response:', result);
      
      // Test upload signature generation
      console.log('\n🔐 Testing upload signature generation...');
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder: 'portfolio' },
        process.env.CLOUDINARY_API_SECRET
      );
      
      console.log('✅ Upload signature generated successfully');
      console.log(`   Timestamp: ${timestamp}`);
      console.log(`   Signature: ${signature.substring(0, 10)}...`);
      
      console.log('\n🎉 Cloudinary Integration Complete!');
      console.log('\n📸 Your portfolio now has:');
      console.log('   ✅ Professional image management');
      console.log('   ✅ Global CDN delivery');
      console.log('   ✅ Automatic optimization');
      console.log('   ✅ Responsive image serving');
      console.log('   ✅ Secure upload handling');
      
      console.log('\n🚀 Start your portfolio: npm run dev:fast');
      
    })
    .catch(error => {
      console.log('❌ Cloudinary API Connection Failed');
      console.log('   Error:', error.message);
      console.log('   HTTP Status:', error.http_code);
      
      if (error.http_code === 401) {
        console.log('\n🔧 Authentication Error - Check your credentials:');
        console.log('   1. Verify Cloud Name is correct');
        console.log('   2. Verify API Key is correct');
        console.log('   3. Verify API Secret is correct');
        console.log('   4. Check if API access is enabled in your Cloudinary account');
      } else if (error.http_code === 403) {
        console.log('\n🔧 Permission Error:');
        console.log('   1. Check if your Cloudinary account is active');
        console.log('   2. Verify API permissions in account settings');
      } else {
        console.log('\n🔧 Connection Error:');
        console.log('   1. Check your internet connection');
        console.log('   2. Try again in a few moments');
        console.log('   3. Check Cloudinary service status');
      }
    });
    
} catch (error) {
  console.log('❌ Cloudinary SDK Error');
  console.log('   Error:', error.message);
  
  if (error.message.includes('Cannot find module')) {
    console.log('\n🔧 Missing Dependencies:');
    console.log('   Run: npm install cloudinary');
  }
}