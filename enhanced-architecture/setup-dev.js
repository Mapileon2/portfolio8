const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Enhanced Portfolio for Development...\n');

// Create necessary directories
const directories = [
  'data',
  'uploads',
  'logs'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create development environment file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from .env.example');
  console.log('⚠️  Please update .env with your actual credentials');
}

// Create client-side env file
const envLocalPath = path.join(__dirname, '.env.local');
const envLocalExamplePath = path.join(__dirname, '.env.local.example');

if (!fs.existsSync(envLocalPath) && fs.existsSync(envLocalExamplePath)) {
  fs.copyFileSync(envLocalExamplePath, envLocalPath);
  console.log('✅ Created .env.local file from .env.local.example');
  console.log('⚠️  Please update .env.local with your Firebase config');
}

// Create sample data files
const sampleData = {
  projects: {
    projects: [
      {
        id: 'sample-project-1',
        title: 'Sample E-commerce Platform',
        description: 'A full-stack e-commerce solution built with React and Node.js',
        longDescription: 'This comprehensive e-commerce platform includes features like product catalog, shopping cart, user accounts, order management, payment integration, and admin panel.',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express', 'Stripe'],
        category: 'Web Development',
        featured: true,
        status: 'completed',
        githubUrl: 'https://github.com/example/ecommerce',
        liveUrl: 'https://ecommerce-demo.example.com',
        imageUrl: '/images/projects/ecommerce.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  analytics: {
    events: [],
    pageViews: new Map(),
    visitors: new Set(),
    lastSaved: new Date().toISOString()
  }
};

// Create data files
Object.entries(sampleData).forEach(([filename, data]) => {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Created sample data: ${filename}.json`);
  }
});

console.log('\n🎉 Development setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update .env with your Firebase and Cloudinary credentials');
console.log('2. Update .env.local with your Firebase client config');
console.log('3. Run: npm install');
console.log('4. Run: npm run dev');
console.log('\n⚠️  Important: Follow SECURITY_SETUP_GUIDE.md for production setup');