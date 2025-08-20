# WebRTC Video Meeting with Object Detection

This enhanced version combines real-time video conferencing with AI-powered object detection capabilities and comprehensive performance metrics.

## Features

- **Real-time Video Conferencing**: Connect multiple users through WebRTC
- **Object Detection**: AI-powered object recognition using TensorFlow.js
- **Single User View**: See only the currently connected user's video
- **Performance Metrics**: Real-time latency, FPS, and detection statistics
- **Mobile Support**: Works on both desktop and mobile devices
- **HTTPS Ready**: Compatible with ngrok for external access

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 3000 by default.

## Usage

### Local Development
1. Start the server: `npm start`
2. Open your browser to `http://localhost:3000`
3. Allow camera permissions when prompted
4. The object detection will start automatically on your camera feed

### Using ngrok for Mobile Testing
1. Install ngrok: `npm install -g ngrok`
2. Start your server: `npm start`
3. In a new terminal, run: `ngrok http 3000`
4. Use the HTTPS URL provided by ngrok on your mobile device

**Important**: Camera access requires HTTPS, which ngrok provides.

## Performance Metrics

The application automatically collects comprehensive performance metrics:

### Real-time Metrics Display
- **Current FPS**: Real-time frames per second
- **Total Frames**: Total frames processed
- **Total Detections**: Total objects detected
- **E2E Latency (P95)**: 95th percentile end-to-end latency
- **Server Latency (P95)**: 95th percentile server processing latency
- **Network Latency (P95)**: 95th percentile network transmission latency

### Metrics Collection
- **Frame Timing**: Tracks capture, receive, inference, and display timestamps
- **Latency Breakdown**: Separates network, server, and end-to-end latencies
- **Detection Statistics**: Counts objects detected per frame
- **Performance Trends**: Real-time FPS monitoring

### Exporting Metrics
- **Download Metrics**: Click "Download Metrics" to save metrics.json
- **Reset Metrics**: Click "Reset Metrics" to start fresh measurements
- **Raw Data**: Click "Show Raw Data" to view detailed metrics in console

## Benchmarking

### Running Benchmarks
Use the included benchmark script to measure performance:

```bash
# Client-side benchmark (30 seconds)
./bench/run_bench.sh --duration 30 --mode client

# Server-side benchmark (60 seconds)
./bench/run_bench.sh --duration 60 --mode server

# Custom duration and output file
./bench/run_bench.sh --duration 45 --mode client --output my_metrics.json
```

### Benchmark Modes
- **Client Mode**: Measures browser-side performance (FPS, detection accuracy)
- **Server Mode**: Measures server-side performance (processing speed, throughput)

### Metrics Output
The benchmark generates a `metrics.json` file with:
- **Benchmark Info**: Duration, mode, timestamp
- **Performance Metrics**: FPS, latency percentiles, detection counts
- **System Information**: CPU, memory, network usage (where available)

## How It Works

### Object Detection
- Uses TensorFlow.js with COCO-SSD model
- Detects objects in real-time on connected user's camera feed
- Draws bounding boxes around detected objects
- Shows object class and confidence score

### Video Conferencing
- Your camera appears in the object detection section
- **Only one connected user's video is shown at a time**
- When a new user connects, their video becomes visible
- Previous user's video is automatically hidden
- Clear status indicators show who you're currently viewing

### Performance Measurement
- **Frame-level Timing**: Each frame is tracked from capture to display
- **Latency Calculation**: Network, server, and end-to-end latencies
- **FPS Monitoring**: Real-time frame rate calculation
- **Detection Counting**: Objects detected per frame

## Project Structure

```
node_server/
├── server.js              # Express server with PeerJS integration
├── public/
│   ├── script.js          # WebRTC client logic with single-user view
│   ├── detect.js          # Object detection logic with metrics
│   └── metrics.js         # Performance metrics collection
├── views/
│   └── room.ejs           # HTML template with metrics display
├── bench/
│   └── run_bench.sh       # Benchmark script
└── package.json           # Dependencies
```

## Dependencies

- **Express**: Web server framework
- **Socket.IO**: Real-time communication
- **PeerJS**: WebRTC peer-to-peer connections
- **TensorFlow.js**: AI model inference
- **COCO-SSD**: Pre-trained object detection model

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS (required for camera permissions)
- Check browser console for errors
- Verify camera permissions are granted

### Object Detection Issues
- Check if TensorFlow.js backend is loaded (WASM)
- Ensure the video element has valid dimensions
- Check browser console for model loading errors

### Metrics Issues
- Ensure metrics.js is loaded before other scripts
- Check browser console for metrics collection errors
- Verify that frames are being processed

### Connection Issues
- Verify both Express and PeerJS servers are running
- Check firewall settings allow connections on port 3000
- Ensure ngrok is properly configured for HTTPS

## Notes

- **Object detection** runs on connected user's camera feed
- **Only one user's video** is displayed at a time in the connected user section
- **Automatic switching** occurs when new users connect
- **Performance metrics** are collected automatically
- **Metrics export** provides detailed performance analysis
- The application automatically handles camera permissions and connections
- Mobile devices will use the front-facing camera by default 