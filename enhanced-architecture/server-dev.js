const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Development Server (No external dependencies required)...');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://res.cloudinary.com", "https://via.placeholder.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
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

// Mock data storage
let mockData = {
  caseStudies: [
    {
      id: 'case-study-1',
      projectTitle: 'E-commerce Platform',
      description: 'A full-stack e-commerce solution built with React and Node.js',
      longDescription: 'This comprehensive e-commerce platform includes features like product catalog, shopping cart, user accounts, order management, payment integration, and admin panel.',
      technologies: 'React, Node.js, MongoDB, Express, Stripe',
      challenges: 'Building a scalable architecture that could handle high traffic',
      solutions: 'Implemented microservices architecture with Redis caching',
      results: 'Achieved 99.9% uptime and handled 10k+ concurrent users',
      imageUrl: 'https://via.placeholder.com/800x400',
      projectUrl: 'https://example.com',
      githubUrl: 'https://github.com/example/ecommerce',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'case-study-2',
      projectTitle: 'Task Management App',
      description: 'A collaborative task management application with real-time updates',
      longDescription: 'This task management application allows teams to collaborate effectively with features like real-time updates, task assignments, progress tracking, and team communication.',
      technologies: 'Vue.js, Firebase, Vuetify, Socket.io',
      challenges: 'Implementing real-time collaboration features',
      solutions: 'Used WebSocket connections and optimistic updates',
      results: 'Improved team productivity by 40%',
      imageUrl: 'https://via.placeholder.com/800x400',
      projectUrl: 'https://example.com',
      githubUrl: 'https://github.com/example/taskmanager',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  carouselImages: [
    {
      id: 'image-1',
      url: 'https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Portfolio+Image+1',
      publicId: 'portfolio/image-1',
      service: 'cloudinary',
      caption: 'Featured Project Screenshot',
      title: 'Featured Project',
      thumbnail: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Thumb+1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'image-2',
      url: 'https://via.placeholder.com/800x400/10B981/FFFFFF?text=Portfolio+Image+2',
      publicId: 'portfolio/image-2',
      service: 'cloudinary',
      caption: 'Web Application Demo',
      title: 'Web Application',
      thumbnail: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Thumb+2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  sections: {
    about: {
      title: 'About Me',
      description: 'I am a passionate full-stack developer with expertise in modern web technologies.',
      paragraph1: 'With over 5 years of experience in web development, I specialize in creating scalable and user-friendly applications.',
      paragraph2: 'I love working with React, Node.js, and cloud technologies to build amazing digital experiences.'
    },
    contact: {
      email: 'contact@example.com',
      phone: '+1-234-567-8900',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/example',
      github: 'https://github.com/example'
    },
    hero: {
      title: 'Full Stack Developer',
      subtitle: 'Building amazing web experiences',
      description: 'I create modern, responsive, and scalable web applications using cutting-edge technologies.'
    }
  },
  analytics: {
    totalEvents: 1250,
    uniqueVisitors: 890,
    pageViews: 2340,
    projectViews: 456,
    topPages: [
      { page: '/', views: 450 },
      { page: '/projects', views: 320 },
      { page: '/about', views: 180 },
      { page: '/contact', views: 95 }
    ],
    topProjects: [
      { projectId: 'case-study-1', views: 234 },
      { projectId: 'case-study-2', views: 189 }
    ],
    browserStats: [
      { browser: 'Chrome', count: 567 },
      { browser: 'Firefox', count: 234 },
      { browser: 'Safari', count: 123 },
      { browser: 'Edge', count: 89 }
    ],
    dailyStats: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      events: Math.floor(Math.random() * 100) + 50,
      pageViews: Math.floor(Math.random() * 200) + 100,
      uniqueVisitors: Math.floor(Math.random() * 50) + 25
    })).reverse()
  }
};

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  // In development, always allow access
  req.user = {
    uid: 'dev-user-123',
    email: 'admin@example.com',
    customClaims: { admin: true }
  };
  next();
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      firebase: { status: 'dev-mode', message: 'Running in development mode' },
      cloudinary: { status: 'dev-mode', message: 'Running in development mode' },
      analytics: { status: 'healthy' },
      search: { status: 'healthy' },
      contact: { status: 'healthy' }
    }
  });
});

// Firebase API routes
app.get('/api/firebase/case-studies', (req, res) => {
  res.json({ caseStudies: mockData.caseStudies });
});

app.get('/api/firebase/case-studies/:id', (req, res) => {
  const caseStudy = mockData.caseStudies.find(cs => cs.id === req.params.id);
  if (!caseStudy) {
    return res.status(404).json({ error: 'Case study not found' });
  }
  res.json(caseStudy);
});

app.post('/api/firebase/case-studies', mockAuth, (req, res) => {
  const newCaseStudy = {
    id: 'case-study-' + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockData.caseStudies.push(newCaseStudy);
  res.status(201).json(newCaseStudy);
});

app.put('/api/firebase/case-studies/:id', mockAuth, (req, res) => {
  const index = mockData.caseStudies.findIndex(cs => cs.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Case study not found' });
  }
  mockData.caseStudies[index] = {
    ...mockData.caseStudies[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, message: 'Case study updated successfully' });
});

app.delete('/api/firebase/case-studies/:id', mockAuth, (req, res) => {
  const index = mockData.caseStudies.findIndex(cs => cs.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Case study not found' });
  }
  mockData.caseStudies.splice(index, 1);
  res.json({ success: true, message: 'Case study deleted successfully' });
});

// Carousel images
app.get('/api/firebase/carousel-images', (req, res) => {
  res.json({ images: mockData.carouselImages });
});

app.post('/api/firebase/carousel-images', mockAuth, (req, res) => {
  const newImage = {
    id: 'image-' + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockData.carouselImages.push(newImage);
  res.status(201).json(newImage);
});

app.delete('/api/firebase/carousel-images/:id', mockAuth, (req, res) => {
  const index = mockData.carouselImages.findIndex(img => img.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }
  mockData.carouselImages.splice(index, 1);
  res.json({ success: true, message: 'Image deleted successfully' });
});

// Sections
app.get('/api/firebase/sections', (req, res) => {
  res.json(mockData.sections);
});

app.put('/api/firebase/sections', mockAuth, (req, res) => {
  mockData.sections = { ...mockData.sections, ...req.body };
  res.json({ success: true, message: 'Sections updated successfully' });
});

// Admin verification
app.get('/api/firebase/verify-admin', mockAuth, (req, res) => {
  res.json({
    isAdmin: true,
    user: req.user
  });
});

// Analytics routes
app.get('/api/analytics/summary', (req, res) => {
  res.json(mockData.analytics);
});

app.get('/api/analytics/realtime', (req, res) => {
  res.json({
    activeUsers: Math.floor(Math.random() * 10) + 1,
    currentPageViews: [
      { page: '/', count: Math.floor(Math.random() * 5) + 1 },
      { page: '/projects', count: Math.floor(Math.random() * 3) + 1 }
    ],
    recentEvents: Array.from({ length: 5 }, (_, i) => ({
      type: ['page_view', 'project_view', 'contact_form'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      properties: { page: '/' }
    }))
  });
});

app.post('/api/analytics/track', (req, res) => {
  console.log('📊 Analytics event tracked:', req.body);
  res.json({ success: true });
});

app.post('/api/analytics/pageview', (req, res) => {
  console.log('📊 Page view tracked:', req.body);
  res.json({ success: true });
});

// Search routes
app.get('/api/search', (req, res) => {
  const { q: query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // Simple search through case studies
  const results = mockData.caseStudies
    .filter(cs => 
      cs.projectTitle.toLowerCase().includes(query.toLowerCase()) ||
      cs.description.toLowerCase().includes(query.toLowerCase()) ||
      cs.technologies.toLowerCase().includes(query.toLowerCase())
    )
    .map(cs => ({
      id: cs.id,
      type: 'project',
      title: cs.projectTitle,
      description: cs.description,
      url: `/projects/${cs.id}`,
      score: Math.floor(Math.random() * 100),
      technologies: cs.technologies.split(', '),
      category: 'Web Development'
    }));

  res.json({
    results,
    total: results.length,
    query,
    suggestions: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
    facets: {
      types: [{ value: 'project', count: results.length }],
      categories: [{ value: 'Web Development', count: results.length }],
      technologies: [
        { value: 'React', count: 2 },
        { value: 'Node.js', count: 2 },
        { value: 'JavaScript', count: 2 }
      ]
    }
  });
});

app.get('/api/search/suggestions', (req, res) => {
  const suggestions = ['React', 'Node.js', 'JavaScript', 'MongoDB', 'Vue.js'];
  res.json({ suggestions });
});

// Contact routes
app.post('/api/contact/submit', (req, res) => {
  console.log('📧 Contact form submitted:', req.body);
  res.json({
    id: 'contact-' + Date.now(),
    message: 'Thank you for your message! I\'ll get back to you soon.',
    timestamp: new Date().toISOString()
  });
});

// Projects routes
app.get('/api/projects', (req, res) => {
  // Convert case studies to projects format
  const projects = mockData.caseStudies.map(cs => ({
    id: cs.id,
    title: cs.projectTitle,
    description: cs.description,
    longDescription: cs.longDescription,
    technologies: cs.technologies.split(', '),
    category: 'Web Development',
    featured: true,
    status: 'completed',
    githubUrl: cs.githubUrl,
    liveUrl: cs.projectUrl,
    imageUrl: cs.imageUrl,
    createdAt: cs.createdAt,
    updatedAt: cs.updatedAt
  }));

  res.json({ projects, total: projects.length });
});

// Image upload mock
app.post('/api/images/upload', mockAuth, (req, res) => {
  console.log('🖼️ Mock image upload');
  
  setTimeout(() => {
    res.json({
      success: true,
      image: {
        url: 'https://via.placeholder.com/800x400/6366F1/FFFFFF?text=Uploaded+Image',
        publicId: 'mock-upload-' + Date.now(),
        thumbnail: 'https://via.placeholder.com/300x200/6366F1/FFFFFF?text=Thumb',
        width: 800,
        height: 400,
        bytes: 125000
      }
    });
  }, 1500); // Simulate upload delay
});

app.get('/api/images/upload-signature', mockAuth, (req, res) => {
  res.json({
    signature: 'mock-signature',
    timestamp: Math.round(Date.now() / 1000),
    cloudName: 'mock-cloud',
    apiKey: 'mock-api-key',
    folder: req.query.folder || 'portfolio'
  });
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
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development server running on port ${PORT}`);
  console.log(`📊 Mock analytics enabled`);
  console.log(`🔍 Mock search enabled`);
  console.log(`📧 Mock contact form enabled`);
  console.log(`🔥 Mock Firebase enabled`);
  console.log(`☁️ Mock Cloudinary enabled`);
  console.log(`Environment: development`);
  console.log(`\n🎯 Access your admin panel at: http://localhost:5173/admin`);
  console.log(`🔑 Login with: admin@example.com + any password`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});