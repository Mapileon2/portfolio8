#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Enhanced Portfolio for Vercel Deployment...\n');

// Create Vercel-specific API endpoints
const apiEndpoints = [
  {
    name: 'health.js',
    content: `module.exports = require('./health');`
  },
  {
    name: 'analytics.js', 
    content: `module.exports = require('./analytics-vercel');`
  },
  {
    name: 'firebase.js',
    content: `module.exports = require('./firebase-vercel');`
  },
  {
    name: 'contact.js',
    content: `module.exports = require('./contact');`
  }
];

// Ensure API directory exists
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Create API endpoint files
apiEndpoints.forEach(endpoint => {
  const filePath = path.join(apiDir, endpoint.name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, endpoint.content);
    console.log(`✅ Created API endpoint: ${endpoint.name}`);
  }
});

// Create a simple index.html for the root
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Portfolio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            border: 2px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
            margin: 0 10px;
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .status {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Enhanced Portfolio</h1>
        <p>Your modern portfolio platform is now live on Vercel!</p>
        
        <div>
            <a href="/src/simple-admin.html" class="btn">Admin Dashboard</a>
            <a href="/api/health" class="btn">API Health</a>
        </div>
        
        <div class="status">
            <h3>✅ Deployment Successful</h3>
            <p>All systems are operational and ready to use.</p>
        </div>
    </div>
    
    <script>
        // Test API connectivity
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                console.log('API Health Check:', data);
                if (data.success) {
                    document.querySelector('.status h3').innerHTML = '✅ All Systems Operational';
                }
            })
            .catch(error => {
                console.error('API Health Check Failed:', error);
                document.querySelector('.status h3').innerHTML = '⚠️ API Connection Issues';
            });
    </script>
</body>
</html>`;

// Write index.html
fs.writeFileSync(path.join(__dirname, 'index.html'), indexHtml);
console.log('✅ Created root index.html');

// Update package.json for Vercel
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Ensure Vercel build script exists
if (!packageJson.scripts['vercel-build']) {
  packageJson.scripts['vercel-build'] = 'vite build';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with vercel-build script');
}

console.log('\n🎉 Vercel deployment preparation complete!');
console.log('\n📋 Next Steps:');
console.log('1. Run: vercel --prod');
console.log('2. Configure environment variables in Vercel dashboard');
console.log('3. Access your admin panel at: https://your-app.vercel.app/src/simple-admin.html');
console.log('\n🔧 Environment Variables to set in Vercel:');
console.log('- NODE_ENV=production');
console.log('- FIREBASE_PROJECT_ID (optional)');
console.log('- CLOUDINARY_CLOUD_NAME (optional)');
console.log('- SMTP_HOST (optional)');
console.log('- SMTP_USER (optional)');
console.log('- SMTP_PASS (optional)');
console.log('\n💡 The app will work with mock data if external services are not configured.');