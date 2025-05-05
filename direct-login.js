require('dotenv').config({ path: './backend.env' });
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Simple function to create a JWT token
function createToken() {
  const email = 'admin@example.com';
  
  // Load JWT_SECRET from env
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET not found in environment variables');
    return;
  }
  
  // Create the token payload
  const payload = {
    uid: 'admin123',
    email: email,
    admin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Generate the token
  const token = jwt.sign(payload, jwtSecret);
  
  console.log('JWT Token generated successfully:');
  console.log(token);
  
  // Create a simple HTML file to use the token
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Direct Admin Access</title>
  <style>
    body { font-family: Arial; max-width: 600px; margin: 40px auto; padding: 20px; }
    button { padding: 10px 20px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Direct Admin Access</h1>
  <p>This page will directly log you in with a pre-generated token.</p>
  
  <button id="loginBtn">Login as Admin</button>
  
  <pre id="tokenInfo">JWT Token: ${token}</pre>
  
  <script>
    document.getElementById('loginBtn').addEventListener('click', function() {
      // Store the token in localStorage
      localStorage.setItem('firebase_token', '${token}');
      localStorage.setItem('jwt_token', '${token}');
      localStorage.setItem('user_data', JSON.stringify({
        id: 'admin123',
        email: 'admin@example.com',
        name: 'Admin User',
        isAdmin: true
      }));
      
      // Redirect to admin page
      window.location.href = '/admin.html';
    });
  </script>
</body>
</html>
  `;
  
  // Write the HTML file
  fs.writeFileSync(path.join(__dirname, 'public', 'direct-login.html'), html);
  console.log('Direct login page created at: http://localhost:5000/direct-login.html');
}

createToken(); 