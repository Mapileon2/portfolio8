const { auth } = require('./firebase-admin');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read the admin users list from JSON file
let admins = [];
try {
  const usersPath = path.join(__dirname, 'users.json');
  if (fs.existsSync(usersPath)) {
    const usersData = fs.readFileSync(usersPath, 'utf8');
    admins = JSON.parse(usersData).admins || [];
  }
} catch (error) {
  console.error('Error loading admin users:', error);
}

/**
 * Authentication middleware to protect API routes
 * This verifies a Firebase ID token or JWT token passed in the request header
 */
async function authMiddleware(req, res, next) {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // First try to verify as Firebase token
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Attach the user to the request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        admin: decodedToken.admin || false
      };
      
      console.log('Authenticated with Firebase token:', req.user);
      
      // Continue to the next middleware or route handler
      return next();
    } catch (firebaseError) {
      console.log('Not a valid Firebase token, trying JWT...');
      
      // If not a Firebase token, try as JWT token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach the user to the request object
      req.user = {
        uid: decodedToken.uid || decodedToken.id || 'user-id',
        email: decodedToken.email,
        admin: decodedToken.admin || false
      };
      
      console.log('Authenticated with JWT token:', req.user);
      
      // Continue to the next middleware or route handler
      return next();
    }
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}

/**
 * Admin role check middleware
 * Use this after the authMiddleware to verify the user has admin privileges
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized - Authentication required' });
  }
  
  // Check if user has admin role or is in admins list
  if (req.user.admin === true || admins.includes(req.user.email)) {
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden - Admin access required' });
}

module.exports = { authMiddleware, requireAdmin }; 