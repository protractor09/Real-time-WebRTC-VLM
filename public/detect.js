        // Get references to the HTML elements
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const loader = document.getElementById('loader');
        const messageBox = document.getElementById('message-box');
        let model = null;

        // Constants for the downscaled input size
        const INPUT_WIDTH = 320;
        const INPUT_HEIGHT = 240;

        // Create a hidden, off-screen canvas for downsampling
        const downscaleCanvas = document.createElement('canvas');
        downscaleCanvas.width = INPUT_WIDTH;
        downscaleCanvas.height = INPUT_HEIGHT;
        const downscaleCtx = downscaleCanvas.getContext('2d');

        // Function to show a message to the user
        function showMessage(msg, type = 'info') {
            messageBox.textContent = msg;
            messageBox.style.display = 'block';
            if (type === 'error') {
                messageBox.style.backgroundColor = '#ffcdd2';
                messageBox.style.borderColor = '#e57373';
                messageBox.style.color = '#c62828';
            } else {
                messageBox.style.backgroundColor = '#e3f2fd';
                messageBox.style.borderColor = '#90caf9';
                messageBox.style.color = '#1565c0';
            }
        }

        // Function to hide the message box
        function hideMessage() {
            messageBox.style.display = 'none';
        }

        // Function to start the webcam stream
        async function startWebcam() {
            try {
                // Request access to the user's camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                return new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        resolve(video);
                    };
                });
            } catch (err) {
                // Handle cases where the user denies access or a camera is not found
                console.error("Error accessing the webcam: ", err);
                showMessage('Could not access the webcam. Please ensure you have a camera and have granted permission.', 'error');
                loader.style.display = 'none';
            }
        }

        // Function to detect objects in the video stream
        async function detectObjects() {
            if (!model) {
                console.warn("Model is not loaded yet.");
                requestAnimationFrame(detectObjects);
                return;
            }

            // Check if video is ready and has valid dimensions
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                requestAnimationFrame(detectObjects);
                return;
            }

            // Check if video has a valid stream
            if (!video.srcObject || !video.srcObject.active) {
                requestAnimationFrame(detectObjects);
                return;
            }

            // Start frame timing for metrics
            const frameData = window.metricsCollector.startFrame();
            const recvTs = Date.now();
            
            // Record frame received
            window.metricsCollector.recordFrameReceived(frameData.frameId, frameData.captureTs, recvTs);

            // Downscale the video frame to the target size on the off-screen canvas
            downscaleCtx.drawImage(video, 0, 0, INPUT_WIDTH, INPUT_HEIGHT);

            // Detect objects in the downscaled frame
            const predictions = await model.detect(downscaleCanvas);
            const inferenceTs = Date.now();

            // Record inference completed
            const detections = predictions.map(pred => ({
                label: pred.class,
                score: pred.score,
                xmin: pred.bbox[0] / INPUT_WIDTH,
                ymin: pred.bbox[1] / INPUT_HEIGHT,
                xmax: (pred.bbox[0] + pred.bbox[2]) / INPUT_WIDTH,
                ymax: (pred.bbox[1] + pred.bbox[3]) / INPUT_HEIGHT
            }));

            window.metricsCollector.recordInferenceComplete(frameData.frameId, inferenceTs, detections);

            // Clear the visible canvas from previous frames
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Scale bounding boxes back up to the visible canvas size
            const scaleX = canvas.width / INPUT_WIDTH;
            const scaleY = canvas.height / INPUT_HEIGHT;

            // Draw bounding boxes for each detected object on the visible canvas
            predictions.forEach(prediction => {
                const [x, y, width, height] = prediction.bbox;

                // Scale coordinates
                const scaledX = x * scaleX - 275;
                const scaledY = y * scaleY - 200;
                const scaledWidth = width * scaleX;
                const scaledHeight = height * scaleY;

                ctx.beginPath();
                ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#2ecc71';
                ctx.stroke();

                const text = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;
                const textX = scaledX;
                const textY = scaledY > 20 ? scaledY - 5 : 15;

                ctx.font = "16px 'Inter', sans-serif";
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(textX - 2, textY - 15, ctx.measureText(text).width + 8, 20);

                ctx.fillStyle = '#333';
                ctx.fillText(text, textX + 2, textY);
            });

            // Record overlay displayed for E2E latency
            const overlayTs = Date.now();
            window.metricsCollector.recordOverlayDisplayed(frameData.frameId, overlayTs);

            // Add frame to metrics collection
            window.metricsCollector.addFrame(frameData);

            // Call the next detection frame
            requestAnimationFrame(detectObjects);
        }

        // Function to update canvas dimensions when video changes
        function updateCanvasDimensions() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log(`Canvas dimensions updated: ${canvas.width}x${canvas.height}`);
            }
        }

        // Main function to initialize the application
        async function main() {
            try {
                loader.style.display = 'block';
                showMessage('Loading the WASM backend...');

                // Explicitly set the backend to WebAssembly and wait for it to be ready.
                // This is the critical step to ensure it doesn't use WebGL.
                await tf.setBackend('wasm');
                await tf.ready();

                // Log the chosen backend to the console for verification
                tf.setBackend('wasm');
                await tf.ready();
                
                console.log('TensorFlow.js backend:', tf.getBackend());
                showMessage('Loading the model...');

                // Load the pre-trained coco-ssd model
                model = await cocoSsd.load();

                // Once model is loaded, show a success message
                hideMessage();
                loader.style.display = 'none';

                // Start the webcam and wait for it to load
                await startWebcam();

                // Set the canvas dimensions to match the video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Start the object detection loop
                detectObjects();

            } catch (err) {
                console.error("Failed to load model or start webcam: ", err);
                showMessage('An error occurred during startup. Check the console for details.', 'error');
            }
        }

        // Wait for both the page and the WebRTC camera to be ready
        function waitForCameraAndStart() {
            // Check if the video element has a stream and is ready
            if (video.srcObject && video.videoWidth > 0 && video.videoHeight > 0) {
                // Set canvas dimensions and start detection
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                detectObjects();
            } else {
                // Wait a bit and try again
                setTimeout(waitForCameraAndStart, 100);
            }
        }

        // Start the application when the window loads
        window.onload = function() {
            // Start the main initialization
            main();
            
            // Set up listeners for video changes
            video.addEventListener('loadedmetadata', function() {
                if (model && video.videoWidth > 0 && video.videoHeight > 0) {
                    updateCanvasDimensions();
                    detectObjects();
                }
            });

            // Listen for video source changes (when switching between host and connected user)
            video.addEventListener('loadeddata', function() {
                if (model && video.videoWidth > 0 && video.videoHeight > 0) {
                    updateCanvasDimensions();
                    console.log('Video source changed, updating detection');
                }
            });
        };