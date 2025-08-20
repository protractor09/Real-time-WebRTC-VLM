const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const statusDiv = document.getElementById('status')
const connectionInfoDiv = document.getElementById('connection-info')
const debugInfoDiv = document.getElementById('debug-info')
const noUsersMessage = document.getElementById('no-users-message')
const detectionSubtitle = document.getElementById('detection-subtitle')

const myPeer = new Peer(undefined, {
  host: window.location.hostname,
  port: window.location.port || 443, 
  path: '/peerjs'
});

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
const userVideos = {} // Track user videos by ID
let connectedUsers = 0
let currentActiveUser = null // Track the currently active user
let detectionVideo = null // Video element for object detection

// Update status function
function updateStatus(message) {
  if (statusDiv) {
    statusDiv.textContent = message
  }
  console.log(message)
}

// Update connection info
function updateConnectionInfo() {
  if (connectionInfoDiv) {
    connectedUsers = Object.keys(peers).length + 1 // +1 for yourself
    connectionInfoDiv.textContent = `Users: ${connectedUsers}`
  }
}

// Update debug info
function updateDebugInfo(message) {
  if (debugInfoDiv) {
    debugInfoDiv.textContent = `Debug: ${message}`
  }
  console.log(`Debug: ${message}`)
}

// Function to show only one user's video
function showOnlyUserVideo(userId) {
  // Hide all user videos first
  Object.keys(userVideos).forEach(id => {
    if (userVideos[id] && userVideos[id].parentElement) {
      userVideos[id].parentElement.style.display = 'none'
    }
  })
  
  // Show only the specified user's video
  if (userId && userVideos[userId] && userVideos[userId].parentElement) {
    userVideos[userId].parentElement.style.display = 'block'
    currentActiveUser = userId
    
    // Hide the no-users message
    if (noUsersMessage) {
      noUsersMessage.style.display = 'none'
    }
    
    // Set the detection video to the connected user's stream
    setDetectionVideo(userVideos[userId])
    
    updateStatus(`Currently viewing: User ${userId}`)
    updateDebugInfo(`Showing video for user: ${userId}`)
  }
}

// Function to set the video for object detection
function setDetectionVideo(videoElement) {
  // Get the detection video element from the HTML
  const detectionVideoElement = document.getElementById('video')
  if (detectionVideoElement && videoElement) {
    // Set the detection video source to the connected user's stream
    detectionVideoElement.srcObject = videoElement.srcObject
    detectionVideoElement.play()
    
    // Update the canvas dimensions to match the new video
    const canvas = document.getElementById('canvas')
    if (canvas) {
      canvas.width = videoElement.videoWidth || 640
      canvas.height = videoElement.videoHeight || 480
    }
    
    // Update the detection subtitle
    if (detectionSubtitle) {
      detectionSubtitle.textContent = `Running on connected user's camera`
      detectionSubtitle.style.color = '#2196F3'
    }
    
    updateDebugInfo(`Object detection now running on connected user's video`)
  }
}

// Function to clear all user videos
function clearAllUserVideos() {
  Object.keys(userVideos).forEach(id => {
    if (userVideos[id] && userVideos[id].parentElement) {
      userVideos[id].parentElement.remove()
    }
  })
  userVideos = {}
  currentActiveUser = null
  
  // Show the no-users message
  if (noUsersMessage) {
    noUsersMessage.style.display = 'block'
  }
  
  // Reset detection video to your own camera
  resetDetectionVideo()
  
  updateStatus('No users connected')
  updateDebugInfo('All user videos cleared')
}

// Function to reset detection video to your own camera
function resetDetectionVideo() {
  const detectionVideoElement = document.getElementById('video')
  if (detectionVideoElement && myVideo.srcObject) {
    detectionVideoElement.srcObject = myVideo.srcObject
    detectionVideoElement.play()
    
    // Reset canvas dimensions
    const canvas = document.getElementById('canvas')
    if (canvas) {
      canvas.width = myVideo.videoWidth || 640
      canvas.height = myVideo.videoHeight || 480
    }
    
    // Update the detection subtitle
    if (detectionSubtitle) {
      detectionSubtitle.textContent = `Running on your camera`
      detectionSubtitle.style.color = '#888'
    }
    
    updateDebugInfo(`Object detection reset to host camera`)
  }
}

// Initialize camera and WebRTC functionality
async function initializeCamera() {
  try {
    updateStatus('Requesting camera access...')
    updateDebugInfo('Initializing camera...')
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user' // Use front camera on mobile
      },
      audio: false
    })
    
    // Add your own video with a label
    addVideoStream(myVideo, stream, 'You')
    updateStatus('Camera connected')
    updateConnectionInfo()
    updateDebugInfo('Camera initialized successfully')

    myPeer.on('call', call => {
      updateDebugInfo(`Incoming call from ${call.peer}`)
      call.answer(stream)
      const video = document.createElement('video')
      const userId = call.peer
      
      call.on('stream', userVideoStream => {
        updateDebugInfo(`Received stream from ${userId}`)
        addVideoStream(video, userVideoStream, `User ${userId}`)
        userVideos[userId] = video
        updateConnectionInfo()
        
        // Show only this user's video
        showOnlyUserVideo(userId)
      })
      
      call.on('close', () => {
        updateDebugInfo(`Call closed with ${userId}`)
        if (userVideos[userId]) {
          userVideos[userId].remove()
          delete userVideos[userId]
          updateConnectionInfo()
          
          // If this was the active user, clear the view
          if (currentActiveUser === userId) {
            currentActiveUser = null
            updateStatus('No users connected')
            updateDebugInfo('Active user disconnected')
            
            // Show the no-users message
            if (noUsersMessage) {
              noUsersMessage.style.display = 'block'
            }
            
            // Reset detection to your own camera
            resetDetectionVideo()
          }
        }
      })
    })

    socket.on('user-connected', userId => {
      updateStatus(`User ${userId} connecting...`)
      updateDebugInfo(`Socket: User ${userId} connected`)
      connectToNewUser(userId, stream)
    })
    
    console.log('Camera initialized successfully')
  } catch (error) {
    console.error('Error accessing camera:', error)
    updateStatus('Camera access failed')
    updateDebugInfo(`Camera error: ${error.message}`)
    alert('Unable to access camera. Please check permissions and try again.')
  }
}

// Initialize camera when page loads
initializeCamera()

socket.on('user-disconnected', userId => {
  updateStatus(`User ${userId} disconnected`)
  updateDebugInfo(`Socket: User ${userId} disconnected`)
  if (peers[userId]) {
    peers[userId].close()
    delete peers[userId]
  }
  // Remove the user's video
  if (userVideos[userId]) {
    userVideos[userId].remove()
    delete userVideos[userId]
  }
  updateConnectionInfo()
  
  // If this was the active user, clear the view
  if (currentActiveUser === userId) {
    currentActiveUser = null
    updateStatus('No users connected')
    updateDebugInfo('Active user disconnected')
    
    // Show the no-users message
    if (noUsersMessage) {
      noUsersMessage.style.display = 'block'
    }
    
    // Reset detection to your own camera
    resetDetectionVideo()
  }
})

myPeer.on('open', id => {
  console.log('My peer ID:', id)
  updateStatus('Connected to peer server')
  updateDebugInfo(`Peer ID: ${id}`)
  socket.emit('join-room', 'main-room', id)
})

myPeer.on('error', (err) => {
  console.error('PeerJS error:', err)
  updateStatus('Peer connection error')
  updateDebugInfo(`Peer error: ${err.message}`)
})

function connectToNewUser(userId, stream) {
  try {
    updateDebugInfo(`Attempting to connect to ${userId}`)
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    
    call.on('stream', userVideoStream => {
      updateDebugInfo(`Connected to ${userId} successfully`)
      addVideoStream(video, userVideoStream, `User ${userId}`)
      userVideos[userId] = video
      updateConnectionInfo()
      
      // Show only this user's video
      showOnlyUserVideo(userId)
    })
    
    call.on('close', () => {
      updateDebugInfo(`Connection closed with ${userId}`)
      if (userVideos[userId]) {
        userVideos[userId].remove()
        delete userVideos[userId]
        updateConnectionInfo()
        
        // If this was the active user, clear the view
        if (currentActiveUser === userId) {
          currentActiveUser = null
          updateStatus('No users connected')
          updateDebugInfo('Active user disconnected')
          
          // Show the no-users message
          if (noUsersMessage) {
            noUsersMessage.style.display = 'block'
          }
          
          // Reset detection to your own camera
          resetDetectionVideo()
        }
      }
    })

    peers[userId] = call
    updateStatus(`Connected to user ${userId}`)
  } catch (error) {
    console.error(`Error connecting to user ${userId}:`, error)
    updateStatus(`Failed to connect to user ${userId}`)
    updateDebugInfo(`Connection error: ${error.message}`)
  }
}

function addVideoStream(video, stream, label) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  
  // Create a container for the video and label
  const videoContainer = document.createElement('div')
  videoContainer.className = 'video-container'
  
  // Add the video
  videoContainer.appendChild(video)
  
  // Add a label
  const labelDiv = document.createElement('div')
  labelDiv.className = 'video-label'
  labelDiv.textContent = label
  videoContainer.appendChild(labelDiv)
  
  // Initially hide user videos (they'll be shown when active)
  if (label !== 'You') {
    videoContainer.style.display = 'none'
  }
  
  videoGrid.appendChild(videoContainer)
  
  // Log the connection
  console.log(`Added video stream for: ${label}`)
  updateDebugInfo(`Video added: ${label}`)
}











