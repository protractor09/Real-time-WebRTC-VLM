#!/bin/bash

# WebRTC Object Detection Demo - One-Command Startup
# This script sets up and launches the demo locally

echo "🚀 Starting WebRTC Object Detection Demo..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use. Attempting to use port 3001..."
    PORT=3001
else
    PORT=3000
fi

echo "🌐 Starting server on port $PORT..."

# Start the server
echo "🎯 Demo will be available at: http://localhost:$PORT"
echo "📱 For mobile testing, use ngrok: ngrok http $PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
