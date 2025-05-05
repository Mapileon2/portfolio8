// Deployment script for the portfolio application
// This script can be used to start all necessary servers for production

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./deploy-config');

// Set environment to production
process.env.NODE_ENV = 'production';

// Helper function to create a formatted timestamp
function getTimestamp() {
  const now = new Date();
  return `[${now.toISOString()}]`;
}

// Helper function to log with timestamp and color
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    reset: '\x1b[0m' // reset
  };
  
  console.log(`${colors[type]}${getTimestamp()} ${message}${colors.reset}`);
}

// Helper to start a server process
function startServer(serverFile, name) {
  log(`Starting ${name}...`);
  
  const server = spawn('node', [serverFile], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  server.stdout.on('data', (data) => {
    console.log(`\x1b[35m[${name}]\x1b[0m ${data.toString().trim()}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`\x1b[31m[${name} ERROR]\x1b[0m ${data.toString().trim()}`);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      log(`${name} process exited with code ${code}`, 'error');
      
      // Attempt to restart the server after a delay
      log(`Attempting to restart ${name} in 5 seconds...`, 'warning');
      setTimeout(() => startServer(serverFile, name), 5000);
    } else {
      log(`${name} process exited normally`, 'warning');
    }
  });
  
  return server;
}

// Main function to start the deployment
async function deploy() {
  try {
    log('Starting deployment process...', 'info');
    
    // Check for port conflicts
    const mainPort = config.mainServer.port;
    const carouselPort = config.carouselServer.port;
    
    log(`Main server will use port ${mainPort}`, 'info');
    log(`Carousel server will use port ${carouselPort}`, 'info');
    
    // Start the servers
    const mainServer = startServer('server.js', 'Main Server');
    const carouselServer = startServer('carousel-server.js', 'Carousel Server');
    
    // Setup graceful shutdown
    process.on('SIGINT', () => {
      log('Received SIGINT. Graceful shutdown...', 'warning');
      mainServer.kill('SIGINT');
      carouselServer.kill('SIGINT');
      setTimeout(() => process.exit(0), 1000);
    });
    
    process.on('SIGTERM', () => {
      log('Received SIGTERM. Graceful shutdown...', 'warning');
      mainServer.kill('SIGTERM');
      carouselServer.kill('SIGTERM');
      setTimeout(() => process.exit(0), 1000);
    });
    
    log('All servers started successfully!', 'success');
    log('Press Ctrl+C to stop all servers', 'info');
  } catch (error) {
    log(`Deployment error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Start deployment
deploy(); 