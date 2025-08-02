#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');

console.log('⚡ Portfolio Performance Check');
console.log('=============================');

const startTime = performance.now();

// Check file sizes
const checkFileSize = (filePath, name) => {
  try {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`📁 ${name}: ${sizeKB} KB`);
    return stats.size;
  } catch (error) {
    console.log(`❌ ${name}: File not found`);
    return 0;
  }
};

// Check bundle sizes
console.log('\n📦 Bundle Size Analysis:');
checkFileSize('package.json', 'Package Config');
checkFileSize('simple-server.js', 'Simple Server');
checkFileSize('server.js', 'Main Server');
checkFileSize('src/simple-admin.html', 'Admin Panel');

// Check node_modules size
try {
  const nodeModulesSize = fs.readdirSync('node_modules').length;
  console.log(`📦 Node Modules: ${nodeModulesSize} packages`);
} catch (error) {
  console.log('❌ Node modules not found');
}

// Performance recommendations
console.log('\n⚡ Performance Recommendations:');

const endTime = performance.now();
const checkTime = endTime - startTime;

if (checkTime < 100) {
  console.log('✅ System is responsive');
} else {
  console.log('⚠️ System may be slow');
}

console.log('\n🚀 Speed Options:');
console.log('  npm run dev:fast     - Fastest startup (skip Firebase)');
console.log('  npm run dev:simple   - Normal startup with Firebase');
console.log('  npm start           - Production mode');

console.log(`\n⏱️ Performance check completed in ${checkTime.toFixed(2)}ms`);