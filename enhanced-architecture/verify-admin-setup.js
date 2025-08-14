#!/usr/bin/env node

/**
 * Verify Admin Setup for Modern Google Sign-In
 * This script verifies that arpanguria68@gmail.com is properly configured as admin
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Admin Setup');
console.log('========================\n');

const ENV_FILE = path.join(__dirname, '.env');

function verifySetup() {
  try {
    // Read .env file
    if (!fs.existsSync(ENV_FILE)) {
      console.log('❌ .env file not found');
      return false;
    }

    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    
    // Check Firebase configuration
    console.log('🔥 Firebase Configuration:');
    const firebaseChecks = [
      { key: 'VITE_FIREBASE_API_KEY', expected: 'AIzaSyAep3-lFOQyG97RaYB-iozVWVzlSa_LhV0' },
      { key: 'VITE_FIREBASE_PROJECT_ID', expected: 'portfolioyt-c0193' },
      { key: 'VITE_FIREBASE_AUTH_DOMAIN', expected: 'portfolioyt-c0193.firebaseapp.com' },
      { key: 'VITE_FIREBASE_DATABASE_URL', expected: 'https://portfolioyt-c0193-default-rtdb.firebaseio.com' }
    ];

    let firebaseOk = true;
    firebaseChecks.forEach(check => {
      const match = envContent.match(new RegExp(`${check.key}=(.+)`));
      if (match && match[1] === check.expected) {
        console.log(`   ✅ ${check.key}: ${match[1]}`);
      } else {
        console.log(`   ❌ ${check.key}: ${match ? match[1] : 'NOT FOUND'}`);
        firebaseOk = false;
      }
    });

    // Check admin email configuration
    console.log('\n👤 Admin Email Configuration:');
    const adminEmailMatch = envContent.match(/VITE_ADMIN_EMAILS=(.+)/);
    const primaryEmailMatch = envContent.match(/VITE_ADMIN_EMAIL=(.+)/);

    if (adminEmailMatch && adminEmailMatch[1].includes('arpanguria68@gmail.com')) {
      console.log(`   ✅ VITE_ADMIN_EMAILS: ${adminEmailMatch[1]}`);
      console.log('   ✅ arpanguria68@gmail.com is authorized');
    } else {
      console.log(`   ❌ VITE_ADMIN_EMAILS: ${adminEmailMatch ? adminEmailMatch[1] : 'NOT FOUND'}`);
      console.log('   ❌ arpanguria68@gmail.com is NOT authorized');
      firebaseOk = false;
    }

    if (primaryEmailMatch && primaryEmailMatch[1] === 'arpanguria68@gmail.com') {
      console.log(`   ✅ VITE_ADMIN_EMAIL: ${primaryEmailMatch[1]}`);
      console.log('   ✅ arpanguria68@gmail.com is primary admin');
    } else {
      console.log(`   ❌ VITE_ADMIN_EMAIL: ${primaryEmailMatch ? primaryEmailMatch[1] : 'NOT FOUND'}`);
      console.log('   ❌ arpanguria68@gmail.com is NOT primary admin');
    }

    // Check test file
    console.log('\n🧪 Test File Configuration:');
    const testFile = path.join(__dirname, 'test-modern-google-signin.html');
    if (fs.existsSync(testFile)) {
      const testContent = fs.readFileSync(testFile, 'utf8');
      if (testContent.includes('arpanguria68@gmail.com')) {
        console.log('   ✅ test-modern-google-signin.html includes arpanguria68@gmail.com');
      } else {
        console.log('   ❌ test-modern-google-signin.html does NOT include arpanguria68@gmail.com');
      }
    } else {
      console.log('   ❌ test-modern-google-signin.html not found');
    }

    // Summary
    console.log('\n📋 Setup Summary:');
    console.log(`   Firebase Project: portfolioyt-c0193`);
    console.log(`   Primary Admin: arpanguria68@gmail.com`);
    console.log(`   Configuration: ${firebaseOk ? '✅ READY' : '❌ NEEDS ATTENTION'}`);

    if (firebaseOk) {
      console.log('\n🚀 Next Steps:');
      console.log('1. Open test-modern-google-signin.html in your browser');
      console.log('2. Click "Sign in with Google"');
      console.log('3. Sign in with arpanguria68@gmail.com');
      console.log('4. Verify successful authentication and admin access');
      console.log('\n🔗 Test URL: file://' + path.join(__dirname, 'test-modern-google-signin.html'));
    } else {
      console.log('\n⚠️  Issues Found:');
      console.log('Please check the configuration above and fix any issues.');
    }

    return firebaseOk;

  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
    return false;
  }
}

// Run verification
const success = verifySetup();
process.exit(success ? 0 : 1);