// Script to create a default user in Firebase Authentication
const admin = require('./firebase-admin');
require('dotenv').config({ path: './backend.env' });

async function createDefaultUser() {
  try {
    // Default user credentials
    const email = 'admin@example.com';
    const password = 'password123';
    
    console.log(`Attempting to create user: ${email}`);
    
    // Check if user already exists
    try {
      const userRecord = await admin.auth.getUserByEmail(email);
      console.log('User already exists:', userRecord.uid);
      
      // Update the password
      await admin.auth.updateUser(userRecord.uid, {
        password: password,
      });
      console.log('User password updated');
      
      // Set custom claims for admin role
      await admin.auth.setCustomUserClaims(userRecord.uid, { admin: true });
      console.log('User assigned admin role');
      
      return userRecord.uid;
    } catch (error) {
      // User doesn't exist, create a new one
      if (error.code === 'auth/user-not-found') {
        console.log('User does not exist, creating new user');
        
        const userRecord = await admin.auth.createUser({
          email: email,
          password: password,
          displayName: 'Admin User',
          emailVerified: true,
        });
        
        console.log('User created successfully:', userRecord.uid);
        
        // Set custom claims for admin role
        await admin.auth.setCustomUserClaims(userRecord.uid, { admin: true });
        console.log('User assigned admin role');
        
        return userRecord.uid;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Run the function
createDefaultUser()
  .then(uid => {
    console.log('Done! User ID:', uid);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create user:', error);
    process.exit(1);
  }); 