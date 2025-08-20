// const express = require('express')
// const app = express()
// const server = require('http').Server(app)
// const io = require('socket.io')(server)

// app.set('view engine', 'ejs')
// app.use(express.static('public'))

// // Serve the same room for everyone
// app.get('/', (req, res) => {
//   res.render('room', { roomId: 'main-room' })
// })

// io.on('connection', socket => {
//   socket.on('join-room', (roomId, userId) => {
//     socket.join(roomId)
//     socket.to(roomId).emit('user-connected', userId)

//     socket.on('disconnect', () => {
//       socket.to(roomId).emit('user-disconnected', userId)
//     })
//   })
// })

// server.listen(3000, () => console.log("Server running on :3000"))



const express = require('express');
const { ExpressPeerServer } = require('peer');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// View engine + static files
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Serve the same room for everyone
app.get('/', (req, res) => {
  res.render('room', { roomId: 'main-room' });
});

// Socket.IO logic
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// ✅ Attach PeerJS to the same server (not separate port)
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});
app.use('/peerjs', peerServer);

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`➡️ PeerJS available at http://localhost:${PORT}/peerjs`);
});
