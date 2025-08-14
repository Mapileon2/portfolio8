// Health check API for serverless functions
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

  try {
    const healthData = {
      status: 'OK',
      message: 'Enhanced Portfolio API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      features: {
        adminLogin: true,
        googleAuth: true,
        firebase: true,
        cloudinary: true
      },
      endpoints: {
        '/api/health': 'Health check',
        '/api/admin-login': 'Admin authentication',
        '/admin': 'Enhanced admin panel',
        '/test-google': 'Google sign-in test'
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}