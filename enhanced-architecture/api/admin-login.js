// Serverless function for admin login
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Admin email check (you can modify this list)
    const adminEmails = [
      'arpanguria68@gmail.com',
      'admin@example.com'
    ];

    // Simple demo authentication
    if (adminEmails.includes(email)) {
      // In a real app, you'd verify the password properly
      // For demo purposes, we'll accept any password for admin emails
      
      const userData = {
        uid: `demo-${Date.now()}`,
        email: email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        photoURL: `https://ui-avatars.com/api/?name=${email.charAt(0).toUpperCase()}&background=3B82F6&color=fff&size=100`,
        isAdmin: true,
        provider: 'email',
        lastLogin: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userData,
        token: 'demo-jwt-token'
      });
    } else {
      return res.status(401).json({ 
        error: `Access denied. Only authorized emails can access this admin panel.\n\nAuthorized emails: ${adminEmails.join(', ')}\nYour email: ${email}` 
      });
    }

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}