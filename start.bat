@echo off
chcp 65001 >nul
echo 🚀 Starting WebRTC Object Detection Demo...

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node -v') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 14 (
    echo ❌ Node.js version 14+ is required. Current version: 
    node -v
    pause
    exit /b 1
)

echo ✅ Node.js detected
node -v

REM Check if npm is available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo 🌐 Starting server on port 3000...
echo 🎯 Demo will be available at: http://localhost:3000
echo 📱 For mobile testing, use ngrok: ngrok http 3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
npm start

pause
