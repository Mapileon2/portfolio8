// Deployment Configuration
// This file centralizes all port and environment configurations for deployment

module.exports = {
  // Main server configuration
  mainServer: {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'production'
  },
  
  // Carousel server configuration 
  carouselServer: {
    port: 5002,
    environment: process.env.NODE_ENV || 'production'
  },
  
  // CORS configuration for production
  corsOptions: {
    // Allow your production domain and localhost for development
    origin: [
      'https://your-production-domain.com', 
      'http://localhost:5000',
      'http://localhost:5001',
      'http://localhost:5002'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  
  // Firebase configuration
  firebase: {
    useEmulator: process.env.NODE_ENV !== 'production',
    emulatorHost: 'localhost',
    emulatorPorts: {
      auth: 9099,
      firestore: 8080,
      database: 9000,
      storage: 9199
    }
  },
  
  // Cache settings
  cache: {
    enabled: true,
    maxAge: 3600 // 1 hour in seconds
  },
  
  // Logging configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'dev'
  }
}; 