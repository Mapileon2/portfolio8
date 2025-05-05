require('dotenv').config({ path: './backend.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { auth } = require('./firebase-admin');

const app = express();
const PORT = 5001; // Use a different port

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body));
  }
  
  // Capture the original res.json to add debugging
  const originalJson = res.json;
  res.json = function(data) {
    console.log('Response data:', JSON.stringify(data));
    return originalJson.call(this, data);
  };
  
  next();
});

// Load users from JSON file
function loadUsers() {
  try {
    const usersPath = path.join(__dirname, 'users.json');
    if (fs.existsSync(usersPath)) {
      const usersData = fs.readFileSync(usersPath, 'utf8');
      return JSON.parse(usersData);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return { users: [], admins: [] };
}

// Authentication endpoint - simplified
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('LOGIN REQUEST:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    console.log(`Authenticating user: ${email}`);
    
    // Get users from JSON file
    const usersData = loadUsers();
    const user = usersData.users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials (user not found)' });
    }
    
    console.log('User found, verifying password');
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ error: 'Invalid credentials (password mismatch)' });
    }
    
    console.log('Password verified, generating custom token');
    
    // Check if user is admin
    const isAdmin = user.role === 'admin' || usersData.admins.includes(user.email);
    
    try {
      // Generate a Firebase custom token
      const customToken = await auth.createCustomToken(user.email, {
        email: user.email,
        admin: isAdmin
      });
      
      console.log('Custom token generated successfully');
      
      // Return the token and user info
      res.json({
        token: customToken,
        user: {
          id: user.email,
          email: user.email,
          name: user.name || 'Admin User',
          isAdmin: isAdmin
        }
      });
    } catch (tokenError) {
      console.error('Error generating custom token:', tokenError);
      res.status(500).json({ error: 'Error generating authentication token' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Authentication failed: ' + error.message });
  }
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    mode: 'debug server',
    time: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🐞 Debug server running on port ${PORT}`);
  console.log(`📝 Login URL: http://localhost:${PORT}/simple-login.html`);
}); 