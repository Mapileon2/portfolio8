const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001; // Use different port

console.log('🚀 Starting Simple Development Server...');

// Basic middleware
app.use(express.json());
app.use(express.static('src'));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Simple mock data
const mockData = {
  user: { email: 'admin@example.com', uid: 'dev-123' },
  caseStudies: [
    {
      id: '1',
      projectTitle: 'E-commerce Platform',
      description: 'A modern e-commerce solution',
      technologies: 'React, Node.js, MongoDB',
      createdAt: new Date().toISOString()
    }
  ],
  images: [
    {
      id: '1',
      url: 'https://via.placeholder.com/800x400',
      caption: 'Sample Image',
      createdAt: new Date().toISOString()
    }
  ]
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/firebase/verify-admin', (req, res) => {
  res.json({ isAdmin: true, user: mockData.user });
});

app.get('/api/firebase/case-studies', (req, res) => {
  res.json({ caseStudies: mockData.caseStudies });
});

app.post('/api/firebase/case-studies', (req, res) => {
  const newCase = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  mockData.caseStudies.push(newCase);
  res.json(newCase);
});

app.get('/api/firebase/carousel-images', (req, res) => {
  res.json({ images: mockData.images });
});

app.get('/api/firebase/sections', (req, res) => {
  res.json({ about: { title: 'About', description: 'Sample about section' } });
});

app.get('/api/analytics/summary', (req, res) => {
  res.json({
    totalEvents: 100,
    uniqueVisitors: 50,
    pageViews: 200,
    topPages: [{ page: '/', views: 50 }],
    topProjects: [{ projectId: '1', views: 25 }],
    browserStats: [{ browser: 'Chrome', count: 30 }],
    dailyStats: [{ date: new Date().toISOString().split('T')[0], events: 10, pageViews: 20, uniqueVisitors: 5 }]
  });
});

app.get('/api/analytics/realtime', (req, res) => {
  res.json({
    activeUsers: 3,
    currentPageViews: [{ page: '/', count: 2 }],
    recentEvents: [{ type: 'page_view', timestamp: new Date().toISOString() }]
  });
});

app.post('/api/analytics/track', (req, res) => {
  console.log('📊 Event tracked:', req.body.type);
  res.json({ success: true });
});

// Catch all
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`✅ Simple server running on http://localhost:${PORT}`);
  console.log(`🎯 API available at http://localhost:${PORT}/api/health`);
  console.log(`📊 Mock data loaded successfully`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down...');
  process.exit(0);
});