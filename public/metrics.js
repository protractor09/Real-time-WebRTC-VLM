// Metrics collection and performance measurement
class MetricsCollector {
    constructor() {
        this.metrics = {
            frames: [],
            startTime: Date.now(),
            totalFrames: 0,
            totalDetections: 0
        };
        this.frameCounter = 0;
        this.lastFrameTime = 0;
        this.fpsCounter = 0;
        this.fpsStartTime = Date.now();
        
        // Enable detailed frame logging
        this.enableFrameLogging = true;
        this.frameLogs = [];
    }

    // Start timing a frame
    startFrame() {
        this.frameCounter++;
        const frameId = `frame_${this.frameCounter}`;
        const captureTs = Date.now();
        
        const frameData = {
            frameId,
            captureTs,
            startTime: performance.now()
        };
        
        // Add frame to tracking immediately
        this.addFrame(frameData);
        
        return frameData;
    }

    // Record frame received
    recordFrameReceived(frameId, captureTs, recvTs) {
        const frame = this.metrics.frames.find(f => f.frameId === frameId);
        if (frame) {
            frame.recvTs = recvTs;
            frame.networkLatency = recvTs - captureTs;
        }
    }

    // Record inference completed
    recordInferenceComplete(frameId, inferenceTs, detections) {
        const frame = this.metrics.frames.find(f => f.frameId === frameId);
        if (frame) {
            frame.inferenceTs = inferenceTs;
            frame.detections = detections;
            frame.serverLatency = inferenceTs - frame.recvTs;
            frame.totalLatency = inferenceTs - frame.captureTs;
            
            // Count detections
            this.metrics.totalDetections += detections.length;
            
            // Log the frame message in the requested format
            this.logFrameMessage(frameId, frame.captureTs, frame.recvTs, inferenceTs, detections);
        }
    }

    // Record overlay displayed
    recordOverlayDisplayed(frameId, overlayTs) {
        const frame = this.metrics.frames.find(f => f.frameId === frameId);
        if (frame) {
            frame.overlayTs = overlayTs;
            frame.e2eLatency = overlayTs - frame.captureTs;
        }
    }

    // Log frame message in the exact format requested
    logFrameMessage(frameId, captureTs, recvTs, inferenceTs, detections) {
        if (!this.enableFrameLogging) return;
        
        const frameMessage = {
            frame_id: frameId,
            capture_ts: captureTs,
            recv_ts: recvTs,
            inference_ts: inferenceTs,
            detections: detections.map(detection => ({
                label: detection.label,
                score: detection.score,
                xmin: detection.xmin,
                ymin: detection.ymin,
                xmax: detection.xmax,
                ymax: detection.ymax
            }))
        };
        
        // Add to frame logs
        this.frameLogs.push(frameMessage);
        
        // Log to console
        console.log('Frame Detection:', JSON.stringify(frameMessage, null, 2));
        
        // Also log to a dedicated frame log element if it exists
        this.updateFrameLogDisplay(frameMessage);
    }

    // Update frame log display in the UI
    updateFrameLogDisplay(frameMessage) {
        const frameLogElement = document.getElementById('frame-log');
        if (frameLogElement) {
            const logEntry = document.createElement('div');
            logEntry.className = 'frame-log-entry';
            logEntry.innerHTML = `
                <strong>${frameMessage.frame_id}</strong> - 
                ${frameMessage.detections.length} detection(s) - 
                ${new Date(frameMessage.capture_ts).toLocaleTimeString()}
            `;
            
            // Add to the top of the log
            frameLogElement.insertBefore(logEntry, frameLogElement.firstChild);
            
            // Keep only last 50 entries to prevent memory issues
            while (frameLogElement.children.length > 50) {
                frameLogElement.removeChild(frameLogElement.lastChild);
            }
        }
    }

    // Add a new frame to tracking
    addFrame(frameData) {
        this.metrics.frames.push(frameData);
        this.metrics.totalFrames++;
        
        // Update FPS counter
        this.fpsCounter++;
        const now = Date.now();
        if (now - this.fpsStartTime >= 1000) { // Every second
            this.metrics.currentFPS = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsStartTime = now;
        }
    }

    // Calculate performance metrics
    calculateMetrics() {
        const frames = this.metrics.frames.filter(f => f.e2eLatency !== undefined);
        
        if (frames.length === 0) {
            return {
                totalFrames: this.metrics.totalFrames,
                totalDetections: this.metrics.totalDetections,
                currentFPS: this.metrics.currentFPS || 0,
                message: "No complete frames available for metrics"
            };
        }

        // Sort latencies for percentile calculations
        const e2eLatencies = frames.map(f => f.e2eLatency).sort((a, b) => a - b);
        const serverLatencies = frames.map(f => f.serverLatency).filter(l => l !== undefined).sort((a, b) => a - b);
        const networkLatencies = frames.map(f => f.networkLatency).filter(l => l !== undefined).sort((a, b) => a - b);

        // Calculate percentiles
        const median = (arr) => arr[Math.floor(arr.length / 2)];
        const p95 = (arr) => arr[Math.floor(arr.length * 0.95)];

        return {
            totalFrames: this.metrics.totalFrames,
            totalDetections: this.metrics.totalDetections,
            currentFPS: this.metrics.currentFPS || 0,
            processedFrames: frames.length,
            runDuration: Date.now() - this.metrics.startTime,
            
            // E2E Latency (overlay display - capture)
            e2eLatency: {
                median: median(e2eLatencies),
                p95: p95(e2eLatencies),
                min: Math.min(...e2eLatencies),
                max: Math.max(...e2eLatencies),
                mean: e2eLatencies.reduce((a, b) => a + b, 0) / e2eLatencies.length
            },
            
            // Server Latency (inference - receive)
            serverLatency: serverLatencies.length > 0 ? {
                median: median(serverLatencies),
                p95: p95(serverLatencies),
                min: Math.min(...serverLatencies),
                max: Math.max(...serverLatencies),
                mean: serverLatencies.reduce((a, b) => a + b, 0) / serverLatencies.length
            } : null,
            
            // Network Latency (receive - capture)
            networkLatency: networkLatencies.length > 0 ? {
                median: median(networkLatencies),
                p95: p95(networkLatencies),
                min: Math.min(...networkLatencies),
                max: Math.max(...networkLatencies),
                mean: networkLatencies.reduce((a, b) => a + b, 0) / networkLatencies.length
            } : null
        };
    }

    // Export metrics to JSON
    exportMetrics() {
        const metrics = this.calculateMetrics();
        return JSON.stringify(metrics, null, 2);
    }

    // Export frame-by-frame detection logs
    exportFrameLogs() {
        return JSON.stringify(this.frameLogs, null, 2);
    }

    // Download metrics as JSON file
    downloadMetrics(filename = 'metrics.json') {
        const dataStr = this.exportMetrics();
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    // Download frame-by-frame detection logs
    downloadFrameLogs(filename = 'frame_detections.json') {
        const dataStr = this.exportFrameLogs();
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    // Reset metrics
    reset() {
        this.metrics = {
            frames: [],
            startTime: Date.now(),
            totalFrames: 0,
            totalDetections: 0
        };
        this.frameCounter = 0;
        this.fpsCounter = 0;
        this.fpsStartTime = Date.now();
        this.frameLogs = [];
        
        // Clear frame log display
        const frameLogElement = document.getElementById('frame-log');
        if (frameLogElement) {
            frameLogElement.innerHTML = '';
        }
    }

    // Toggle frame logging
    toggleFrameLogging() {
        this.enableFrameLogging = !this.enableFrameLogging;
        console.log(`Frame logging ${this.enableFrameLogging ? 'enabled' : 'disabled'}`);
        return this.enableFrameLogging;
    }

    // Get current frame logging status
    getFrameLoggingStatus() {
        return this.enableFrameLogging;
    }
}

// Global metrics instance
window.metricsCollector = new MetricsCollector();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetricsCollector;
} 