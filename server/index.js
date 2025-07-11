const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // For development only! Lock this down in production.
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory room state (for demo; use a DB for production)
const rooms = {};

// Socket.io logic
io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);

    // Add user to room
    if (!rooms[roomId]) rooms[roomId] = { users: [], code: '' };
    if (!rooms[roomId].users.includes(userName)) {
      rooms[roomId].users.push(userName);
    }

    // Send current users and code to all in room
    io.to(roomId).emit('users-update', rooms[roomId].users);
    socket.emit('code-update', rooms[roomId].code);
  });

  socket.on('code-change', ({ roomId, code }) => {
    if (rooms[roomId]) {
      rooms[roomId].code = code;
      socket.to(roomId).emit('code-update', code);
    }
  });

  socket.on('leave-room', ({ roomId, userName }) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u !== userName);
      io.to(roomId).emit('users-update', rooms[roomId].users);
    }
  });

  socket.on('disconnecting', () => {
    // Remove user from all rooms
    for (const roomId of socket.rooms) {
      if (rooms[roomId]) {
        rooms[roomId].users = rooms[roomId].users.filter(u => u !== socket.userName);
        io.to(roomId).emit('users-update', rooms[roomId].users);
      }
    }
  });
});

// (Optional) Code execution endpoint (stub)
app.post('/api/execute', async (req, res) => {
  // You can integrate with Judge0 or another code execution API here
  // For now, just echo the code and input
  const { code, language, input } = req.body;
  res.json({ output: `Executed code in ${language}:\n${code}\nWith input:\n${input}` });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

