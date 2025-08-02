#!/usr/bin/env node

console.log('⚡ Starting Portfolio (Fast Mode)...');
console.log('Skipping Firebase setup for faster startup...');

const { spawn } = require('child_process');

// Start the simple server directly (fastest startup)
const server = spawn('node', ['simple-server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    SKIP_FIREBASE_INIT: 'true',
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('close', (code) => {
  console.log(`\n👋 Server stopped with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});

// Show instructions immediately (no delay)
console.log('');
console.log('⚡ FAST MODE ACTIVE - Portfolio starting...');
console.log('🎯 Open your browser to: http://localhost:3001/src/simple-admin.html');
console.log('🔑 Login: admin@example.com (any password)');
console.log('');
console.log('💡 For full Firebase features, use: npm run dev:simple');
console.log('Press Ctrl+C to stop');