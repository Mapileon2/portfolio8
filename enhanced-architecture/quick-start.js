#!/usr/bin/env node

// Ultra-fast startup script
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 Ultra-Fast Portfolio Starting...');

// Minimal middleware
app.use(express.static('.'));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: 'ultra-fast',
    timestamp: new Date().toISOString()
  });
});

// Simple Firebase check
app.get('/api/firebase-check', (req, res) => {
  const configured = !!(process.env.FIREBASE_PROJECT_ID && 
                        !process.env.FIREBASE_PROJECT_ID.includes('your-'));
  
  res.json({
    success: true,
    firebase: configured ? 'configured' : 'not-configured',
    projectId: process.env.FIREBASE_PROJECT_ID || 'not-set',
    adminEmail: process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'not-set'
  });
});

// Mock analytics
app.get('/api/analytics/summary', (req, res) => {
  res.json({
    success: true,
    data: {
      totalViews: Math.floor(Math.random() * 10000) + 1000,
      uniqueVisitors: Math.floor(Math.random() * 5000) + 500,
      avgSessionDuration: Math.floor(Math.random() * 300) + 60,
      bounceRate: (Math.random() * 0.5 + 0.2).toFixed(2)
    }
  });
});

// Mock case studies
app.get('/api/firebase/case-studies', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'demo-1',
        projectTitle: 'Portfolio Website',
        description: 'Modern portfolio with admin panel',
        technologies: ['React', 'Node.js', 'Firebase'],
        status: 'published',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.redirect('/src/simple-admin.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/src/simple-admin.html`);
  console.log(`🔥 Firebase check: http://localhost:${PORT}/api/firebase-check`);
  console.log('');
  console.log('⚡ Ultra-fast mode active - minimal features, maximum speed!');
  console.log('💡 For full features, use: npm run dev');
});