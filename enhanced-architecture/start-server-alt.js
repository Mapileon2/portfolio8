#!/usr/bin/env node

console.log('🚀 Starting Portfolio Server (Alternative Port)...');

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Try different ports if 3001 is busy
const PORTS = [3002, 3003, 3004, 3005];
let PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Portfolio server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Mock data for testing
app.get('/api/projects', (req, res) => {
  res.json([
    {
      id: 1,
      title: 'Modern Portfolio',
      description: 'A comprehensive portfolio with admin panel',
      technologies: ['React', 'Node.js', 'Firebase'],
      status: 'completed',
      featured: true
    }
  ]);
});

// Serve admin panels
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'working-admin-panel.html'));
});

app.get('/enhanced-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'working-admin-panel.html'));
});

app.get('/simple-admin', (req, res) => {
  res.redirect('/src/simple-admin.html');
});

// Serve test files
app.get('/test-google', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-google-test.html'));
});

app.get('/test-react', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-modern-google-signin.html'));
});

// Catch all
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    // Try to serve the requested file
    const filePath = path.join(__dirname, req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.sendFile(path.join(__dirname, 'src', 'enhanced-admin.html'));
      }
    });
  }
});

// Start server with port fallback
function startServer(portIndex = 0) {
  if (portIndex >= PORTS.length) {
    console.error('❌ All ports are busy. Please close other servers and try again.');
    process.exit(1);
  }

  PORT = PORTS[portIndex];
  
  const server = app.listen(PORT, () => {
    console.log(`\n✅ Portfolio Server Started Successfully!`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`\n📊 Admin Panels:`);
    console.log(`   🏠 Enhanced Admin: http://localhost:${PORT}/admin`);
    console.log(`   🏠 Enhanced Admin: http://localhost:${PORT}/enhanced-admin`);
    console.log(`   ⚡ Simple Admin: http://localhost:${PORT}/src/simple-admin.html`);
    console.log(`\n🧪 Test Authentication:`);
    console.log(`   ✅ Simple Test: http://localhost:${PORT}/test-google`);
    console.log(`   ⚛️ React Test: http://localhost:${PORT}/test-react`);
    console.log(`\n🔑 Login with: arpanguria68@gmail.com`);
    console.log(`\n💡 Press Ctrl+C to stop the server`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is busy, trying next port...`);
      startServer(portIndex + 1);
    } else {
      console.error('❌ Server error:', err);
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();