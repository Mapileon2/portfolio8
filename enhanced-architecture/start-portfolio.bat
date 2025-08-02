@echo off
echo 🚀 Starting Enhanced Portfolio...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the enhanced-architecture directory
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Start the portfolio
echo 🎯 Starting portfolio server...
npm run dev:simple

pause