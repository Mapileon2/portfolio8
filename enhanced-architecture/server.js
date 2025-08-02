const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import services
const AnalyticsService = require('./services/AnalyticsService');
const SearchService = require('./services/SearchService');
const ContactService = require('./services/ContactService');
const FirebaseService = require('./services/FirebaseServiceProduction');
const CloudinaryService = require('./services/CloudinaryService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services with error handling for development
let firebase, cloudinary;
const analytics = new AnalyticsService();
const search = new SearchService();
const contact = new ContactService();

// Initialize Firebase and Cloudinary with fallbacks for development
try {
  firebase = new FirebaseService();
  console.log('🔥 Firebase service initialized');
} catch (error) {
  console.log('🔧 Firebase not configured, using development mode');
  firebase = {
    healthCheck: () => ({ status: 'dev-mode', message: 'Firebase not configured' }),
    disconnect: () => Promise.resolve()
  };
}

try {
  cloudinary = new CloudinaryService();
  console.log('☁️ Cloudinary service initialized');
} catch (error) {
  console.log('🔧 Cloudinary not configured, using development mode');
  cloudinary = {
    healthCheck: () => ({ status: 'dev-mode', message: 'Cloudinary not configured' })
  };
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Add services to request object
app.use((req, res, next) => {
  req.services = {
    firebase,
    cloudinary,
    analytics,
    search,
    contact
  };
  next();
});

// Analytics middleware
app.use((req, res, next) => {
  // Track API requests
  if (req.path.startsWith('/api/')) {
    analytics.trackEvent('api_request', {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }
  next();
});

// API Routes
app.use('/api/analytics', require('./api/analytics'));
app.use('/api/search', require('./api/search'));
app.use('/api/contact', require('./api/contact'));
app.use('/api/projects', require('./api/projects'));
app.use('/api/firebase', require('./api/firebase'));
app.use('/api/images', require('./api/images'));
app.use('/api/frontend', require('./api/frontend-updates'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const firebaseHealth = await firebase.healthCheck();
    const cloudinaryHealth = await cloudinary.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        firebase: firebaseHealth,
        cloudinary: cloudinaryHealth,
        analytics: { status: 'healthy' },
        search: { status: 'healthy' },
        contact: { status: 'healthy' }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Track error
  analytics.trackEvent('server_error', {
    error: err.message,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Enhanced Portfolio server running on port ${PORT}`);
  console.log(`🔥 Firebase integration enabled`);
  console.log(`☁️ Cloudinary integration enabled`);
  console.log(`📊 Analytics enabled`);
  console.log(`🔍 Search enabled`);
  console.log(`📧 Contact form enabled`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test service connections
  try {
    const firebaseHealth = await firebase.healthCheck();
    const cloudinaryHealth = await cloudinary.healthCheck();
    
    console.log(`Firebase: ${firebaseHealth.status}`);
    console.log(`Cloudinary: ${cloudinaryHealth.status}`);
  } catch (error) {
    console.warn('Service health check failed:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await firebase.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await firebase.disconnect();
  process.exit(0);
});

module.exports = app;