// CORS middleware for API access from Vercel
const setupCors = (app) => {
  // Add proper CORS headers for all routes
  app.use((req, res, next) => {
    // Get allowed origins from environment variables or use wildcard
    const allowedOrigins = process.env.ALLOW_ORIGINS ? 
      process.env.ALLOW_ORIGINS.split(',') : 
      ['https://arpan-guria-production-level-portfolio.vercel.app'];
    
    // Check if the request origin is in our allowed origins list
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    } else {
      // Default to the Vercel deployment URL if origin doesn't match
      res.header('Access-Control-Allow-Origin', 'https://arpan-guria-production-level-portfolio.vercel.app');
    }
    
    // Allow all common HTTP methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    
    // Allow all common headers
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    
    // Allow credentials (cookies, etc.)
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  console.log('📊 CORS middleware initialized');
};

module.exports = setupCors; 