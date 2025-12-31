const express = require('express');
const http = require('http');
const cors = require('cors');
const axios = require('axios');
const { Server } = require('socket.io');
const judgeRoutes = require('./routes/judge');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const { setupWSConnection } = require('@y/websocket-server/utils');

// MongoDB connection (non-blocking)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 2000, // Timeout after 2 seconds
  socketTimeoutMS: 2000,
}).then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️  Make sure MongoDB is running: mongod or brew services start mongodb-community');
  console.log('⚠️  Server will continue but room persistence may not work');
  console.log('⚠️  Using in-memory storage for now');
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  users: [String],
  files: [{
    id: String,
    name: String,
    content: String,
    language: String
  }],
  code: { type: String, default: '' },
});
const Room = mongoose.model('Room', roomSchema);

const app = express();
const server = http.createServer(app);
const MAX_USERS = 5;
const USER_COLORS = [
  '#38b6ff', '#fbbf24', '#7f5af0', '#ef4444', '#22c55e', '#e76f00', '#00599c',
  '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'
];

function getUserColor(userName) {
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

app.use(cors());
app.use(express.json());
app.use('/api/judge', judgeRoutes);

// Track active users per room by socket ID
const activeUsers = new Map(); // roomId -> Map<socketId, {userName, socketId, joinedAt, color}>

// Socket.IO for user management and awareness
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// WebSocket server for Yjs document sync
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('room') || url.pathname.split('/').pop();
    
    if (!roomId) {
      console.warn('Yjs WebSocket: No room ID provided');
      ws.close();
      return;
    }
    
    console.log(`🔌 Yjs WebSocket connection for room: ${roomId}`, {
      url: req.url,
      headers: req.headers
    });
    setupWSConnection(ws, req, { 
      gc: true,
      // Room ID is used as document name
      docName: roomId
    });
    
    // Log WebSocket events
    ws.on('message', (data) => {
      console.log('📨 Yjs WebSocket message received:', data.length, 'bytes');
    });
    
    ws.on('close', () => {
      console.log('🔌 Yjs WebSocket closed for room:', roomId);
    });
    
    ws.on('error', (err) => {
      console.error('❌ Yjs WebSocket error:', err);
    });
  } catch (err) {
    console.error('Yjs WebSocket connection error:', err);
    ws.close();
  }
});

// Upgrade HTTP server to handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  
  if (pathname === '/yjs') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Socket.IO for user management
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', async ({ roomId, userName }) => {
    if (!roomId || !userName) {
      console.warn('Invalid join-room request:', { roomId, userName });
      return;
    }
    
    console.log(`User ${userName} (${socket.id}) joining room ${roomId}`);
    socket.join(roomId);
    socket.userName = userName;
    socket.currentRoomId = roomId;
    socket.userColor = getUserColor(userName);
    
    // Track user in memory map
    if (!activeUsers.has(roomId)) {
      activeUsers.set(roomId, new Map());
    }
    const roomUsers = activeUsers.get(roomId);
    roomUsers.set(socket.id, { 
      userName, 
      socketId: socket.id, 
      joinedAt: Date.now(),
      color: socket.userColor
    });
    
    // Check room capacity
    if (roomUsers.size > MAX_USERS) {
      roomUsers.delete(socket.id);
      socket.emit('room-full');
      return;
    }
    
    // Try to get room from MongoDB, fallback to in-memory if MongoDB not connected
    let room = null;
    let roomFiles = [{
      id: '1',
      name: 'main.js',
      content: '// Start coding in JavaScript!',
      language: 'js'
    }];
    
    try {
      if (mongoose.connection.readyState === 1) {
        room = await Room.findOne({ roomId });
        if (!room) {
          room = new Room({ 
            roomId, 
            users: [], 
            files: roomFiles,
            code: '// Start coding in JavaScript!' 
          });
          await room.save();
        }
        if (room && room.files && room.files.length > 0) {
          roomFiles = room.files;
        }
      } else {
        console.log('⚠️  MongoDB not connected, using default files');
      }
    } catch (err) {
      console.error('Error accessing MongoDB:', err.message);
    }
    
    // Get unique user names from active sockets
    const uniqueUsers = Array.from(roomUsers.values()).map(u => ({
      name: u.userName,
      color: u.color,
      socketId: u.socketId
    }));
    
    // Send current users to all in room
    io.to(roomId).emit('users-update', uniqueUsers);
    io.to(roomId).emit('files-update', roomFiles);
    
    // Send initial code to the newly joined user
    const currentFile = roomFiles[0];
    if (currentFile) {
      socket.emit('code-update', { fileId: currentFile.id, code: currentFile.content });
    }
    
    console.log(`Room ${roomId} now has ${roomUsers.size} active users:`, uniqueUsers.map(u => u.name));
  });

  socket.on('leave-room', async ({ roomId, userName }) => {
    console.log(`User ${userName} (${socket.id}) leaving room ${roomId}`);
    socket.leave(roomId);
    
    // Remove from active users map
    if (activeUsers.has(roomId)) {
      activeUsers.get(roomId).delete(socket.id);
      const roomUsers = activeUsers.get(roomId);
      const uniqueUsers = Array.from(roomUsers.values()).map(u => ({
        name: u.userName,
        color: u.color,
        socketId: u.socketId
      }));
      
      // Clean up empty room
      if (roomUsers.size === 0) {
        activeUsers.delete(roomId);
      }
      
      // Broadcast updated user list
      io.to(roomId).emit('users-update', uniqueUsers);
      console.log(`Room ${roomId} now has ${roomUsers.size} active users`);
    }
  });

  socket.on('disconnecting', async () => {
    console.log(`Socket ${socket.id} disconnecting from rooms:`, Array.from(socket.rooms));
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue; // Skip the socket's own room
      
      // Remove from active users map
      if (activeUsers.has(roomId)) {
        activeUsers.get(roomId).delete(socket.id);
        const roomUsers = activeUsers.get(roomId);
        const uniqueUsers = Array.from(roomUsers.values()).map(u => ({
          name: u.userName,
          color: u.color,
          socketId: u.socketId
        }));
        
        // Clean up empty room
        if (roomUsers.size === 0) {
          activeUsers.delete(roomId);
        }
        
        // Broadcast updated user list
        io.to(roomId).emit('users-update', uniqueUsers);
        console.log(`Room ${roomId} now has ${roomUsers.size} active users after disconnect`);
      }
    }
  });
});

// Code execution endpoint
app.post('/api/execute', async (req, res) => {
  const { code, language, input } = req.body;
  res.json({ output: `Executed code in ${language}:\n${code}\nWith input:\n${input}` });
});

const PORT = process.env.PORT || 5001;

// Start server immediately (don't wait for MongoDB)
server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`✅ Socket.IO available at http://localhost:${PORT}`);
  console.log(`✅ Yjs WebSocket available at ws://localhost:${PORT}/yjs`);
  console.log(`✅ Code execution endpoint: http://localhost:${PORT}/api/judge/run`);
  console.log('');
  console.log('Server is ready! MongoDB connection will be established in background.');
});
