/**
 * This script creates a 1x1 pixel test image in the magical-journeys directory
 * Run this script with Node.js to create the test image
 */

const fs = require('fs');
const path = require('path');

// Create a simple 1x1 transparent pixel in PNG format
// This is a minimal valid PNG file for a 1x1 transparent pixel
const pixelData = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIHXDyE8QAAAABJRU5ErkJggg==',
  'base64'
);

// Ensure the directory exists
const dirPath = path.join(__dirname, '..', 'images', 'magical-journeys');

try {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('Created magical-journeys directory');
  }

  // Write the pixel file
  fs.writeFileSync(path.join(dirPath, 'test-pixel.png'), pixelData);
  console.log('Created test-pixel.png in magical-journeys directory');

} catch (error) {
  console.error('Error creating test pixel:', error);
} 