const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Enhanced Portfolio (Simple Mode)...');
console.log('');

// Start the simple server
const server = spawn('node', ['simple-server.js'], {
  cwd: __dirname,
  stdio: 'inherit'
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

// Show instructions after a delay
setTimeout(() => {
  console.log('');
  console.log('🎯 Open your browser and go to:');
  console.log('   http://localhost:3001/simple-admin.html');
  console.log('');
  console.log('🔑 Login with:');
  console.log('   Email: admin@example.com');
  console.log('   Password: any password');
  console.log('');
  console.log('Press Ctrl+C to stop');
}, 2000);