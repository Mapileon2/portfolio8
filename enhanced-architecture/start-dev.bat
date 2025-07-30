@echo off
echo 🚀 Starting Enhanced Portfolio Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Run setup script
echo 🔧 Setting up development environment...
npm run setup
echo.

REM Start development servers
echo 🚀 Starting development servers...
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3000
echo    Admin:    http://localhost:5173/admin
echo.
echo 📝 Development Login:
echo    Email:    admin@example.com
echo    Password: any password
echo.
echo Press Ctrl+C to stop the servers
echo.

npm run dev