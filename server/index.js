const express = require('express');
const http = require('http');
const cors = require('cors');
const axios = require('axios');
const { Server } = require('socket.io');
const judgeRoutes = require('./routes/judge');
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/collab-editor', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  users: [String],
  code: { type: String, default: '' },
});
const Room = mongoose.model('Room', roomSchema);

const app = express();
const server = http.createServer(app);
const MAX_USERS = 5;
const io = new Server(server, {
  cors: {
    origin: '*', // For development only! Lock this down in production.
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/judge', judgeRoutes);

// Socket.io logic
io.on('connection', (socket) => {
  socket.on('join-room', async ({ roomId, userName }) => {
    socket.join(roomId);
    let room = await Room.findOne({ roomId });
    if (!room) {
      room = new Room({ roomId, users: [], code: '' });
    }

    socket.on('presence-update', async ({ roomId, userName, presence }) => {
      // Broadcast to all other users in the room except the sender
      socket.to(roomId).emit('presence-update', { userName, presence });
    });
    
    const currentSize = room.users.length;
    if (!room.users.includes(userName)) {
      if (currentSize >= MAX_USERS) {
        socket.emit('room-full');
        return;
      }
      room.users.push(userName);
      await room.save();
    }
    // Send current users and code to all in room
    io.to(roomId).emit('users-update', room.users);
    socket.emit('code-update', room.code);
  });

  socket.on('code-change', async ({ roomId, code }) => {
    const room = await Room.findOne({ roomId });
    if (room) {
      room.code = code;
      await room.save();
      socket.to(roomId).emit('code-update', code);
    }
  });

  socket.on('leave-room', async ({ roomId, userName }) => {
    socket.leave(roomId);
    const room = await Room.findOne({ roomId });
    if (room) {
      room.users = room.users.filter(u => u !== userName);
      await room.save();
      io.to(roomId).emit('users-update', room.users);
    }
  });

  socket.on('disconnecting', async () => {
    for (const roomId of socket.rooms) {
      const room = await Room.findOne({ roomId });
      if (room) {
        room.users = room.users.filter(u => u !== socket.userName);
        await room.save();
        io.to(roomId).emit('users-update', room.users);
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

