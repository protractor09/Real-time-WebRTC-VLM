# WebRTC Object Detection Demo - PowerShell Startup Script
# This script sets up and launches the demo locally

Write-Host "🚀 Starting WebRTC Object Detection Demo..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 14+ first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js version
$majorVersion = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
if ($majorVersion -lt 14) {
    Write-Host "❌ Node.js version 14+ is required. Current version: $nodeVersion" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Check if port 3000 is available
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 3000)
    $tcpClient.Close()
    Write-Host "⚠️  Port 3000 is already in use. Attempting to use port 3001..." -ForegroundColor Yellow
    $port = 3001
} catch {
    $port = 3000
}

Write-Host "🌐 Starting server on port $port..." -ForegroundColor Cyan
Write-Host "🎯 Demo will be available at: http://localhost:$port" -ForegroundColor Green
Write-Host "📱 For mobile testing, use ngrok: ngrok http $port" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""

# Start the server
npm start
