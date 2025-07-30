#!/bin/bash

echo "🚀 Starting Enhanced Portfolio Development Environment..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Run setup script
echo "🔧 Setting up development environment..."
npm run setup
echo ""

# Start development servers
echo "🚀 Starting development servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   Admin:    http://localhost:5173/admin"
echo ""
echo "📝 Development Login:"
echo "   Email:    admin@example.com"
echo "   Password: any password"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

npm run dev