/**
 * Socket.IO Handler
 * Manages user presence, cursor awareness, and room events
 */

const Room = require('../models/Room');
const { socketAuth } = require('../middleware/auth.middleware');
const { socketRateLimiter } = require('../middleware/rateLimiter.middleware');
const { SOCKET_EVENTS, ERROR_CODES, USER_COLORS } = require('../config/constants');

// Track active users per room
const activeUsers = new Map(); // roomId -> Map<socketId, userData>
const userSockets = new Map(); // userId -> Set<socketId>

/**
 * Get user color based on username hash
 */
function getUserColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

/**
 * Get room users
 */
function getRoomUsers(roomId) {
  const roomUsers = activeUsers.get(roomId);
  if (!roomUsers) return [];
  
  return Array.from(roomUsers.values()).map(u => ({
    id: u.oderId,
    username: u.username,
    color: u.color,
    cursor: u.cursor,
    selection: u.selection,
    activeFileId: u.activeFileId,
    socketId: u.socketId,
  }));
}

/**
 * Setup Socket.IO handlers
 */
function setupSocketHandlers(io) {
  // Apply authentication middleware
  io.use(socketAuth);
  
  // Apply rate limiting
  io.use(socketRateLimiter.middleware());

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`✅ Socket connected: ${user.username} (${socket.id})`);

    // Track user's sockets
    if (!userSockets.has(user.userId)) {
      userSockets.set(user.userId, new Set());
    }
    userSockets.get(user.userId).add(socket.id);

    /**
     * Join Room
     */
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (data) => {
      try {
        const { roomSlug } = data;
        
        if (!roomSlug) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'Room slug is required',
            code: ERROR_CODES.VALIDATION_ERROR,
          });
          return;
        }

        // Verify room access
        const room = await Room.findOne({ slug: roomSlug, isActive: true });
        if (!room) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'Room not found',
            code: ERROR_CODES.NOT_FOUND,
          });
          return;
        }

        if (!room.hasAccess(user.userId)) {
          socket.emit(SOCKET_EVENTS.UNAUTHORIZED, {
            message: 'Access denied to this room',
            code: ERROR_CODES.FORBIDDEN,
          });
          return;
        }

        // Initialize room tracking if needed
        if (!activeUsers.has(roomSlug)) {
          activeUsers.set(roomSlug, new Map());
        }

        const roomUsers = activeUsers.get(roomSlug);

        // Check room capacity
        if (roomUsers.size >= room.settings.maxMembers) {
          socket.emit(SOCKET_EVENTS.ROOM_FULL, {
            message: 'Room is full',
            code: ERROR_CODES.ROOM_FULL,
          });
          return;
        }

        // Join socket room
        socket.join(roomSlug);
        socket.currentRoom = roomSlug;

        // Track user in room
        const userData = {
          oderId: user.oderId,
          username: user.username,
          color: getUserColor(user.username),
          cursor: null,
          selection: null,
          activeFileId: null,
          socketId: socket.id,
          joinedAt: Date.now(),
          role: room.getUserRole(user.userId),
        };

        roomUsers.set(socket.id, userData);

        // Update room activity
        room.lastActivityAt = new Date();
        await room.save();

        // Broadcast updated user list
        io.to(roomSlug).emit(SOCKET_EVENTS.USERS_UPDATE, getRoomUsers(roomSlug));

        console.log(`👤 ${user.username} joined room: ${roomSlug} (${roomUsers.size} users)`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to join room',
          code: ERROR_CODES.INTERNAL_ERROR,
        });
      }
    });

    /**
     * Leave Room
     */
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data) => {
      const { roomSlug } = data;
      leaveRoom(socket, roomSlug, io);
    });

    /**
     * Update Cursor Position
     */
    socket.on(SOCKET_EVENTS.UPDATE_CURSOR, (data) => {
      const { cursor, selection, activeFileId } = data;
      const roomSlug = socket.currentRoom;

      if (!roomSlug || !activeUsers.has(roomSlug)) return;

      const roomUsers = activeUsers.get(roomSlug);
      const userData = roomUsers.get(socket.id);

      if (userData) {
        userData.cursor = cursor;
        userData.selection = selection;
        userData.activeFileId = activeFileId;

        // Broadcast cursor update to others in room
        socket.to(roomSlug).emit(SOCKET_EVENTS.CURSOR_UPDATE, {
          oderId: user.oderId,
          username: user.username,
          color: userData.color,
          cursor,
          selection,
          activeFileId,
        });
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnecting', () => {
      // Leave all rooms
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          leaveRoom(socket, room, io);
        }
      }
    });

    socket.on('disconnect', () => {
      // Remove from user sockets tracking
      const userSocketSet = userSockets.get(user.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(user.userId);
        }
      }

      console.log(`❌ Socket disconnected: ${user.username} (${socket.id})`);
    });
  });
}

/**
 * Helper to leave a room
 */
function leaveRoom(socket, roomSlug, io) {
  if (!roomSlug || !activeUsers.has(roomSlug)) return;

  const roomUsers = activeUsers.get(roomSlug);
  roomUsers.delete(socket.id);

  socket.leave(roomSlug);
  if (socket.currentRoom === roomSlug) {
    socket.currentRoom = null;
  }

  // Clean up empty room
  if (roomUsers.size === 0) {
    activeUsers.delete(roomSlug);
  } else {
    // Broadcast updated user list
    io.to(roomSlug).emit(SOCKET_EVENTS.USERS_UPDATE, getRoomUsers(roomSlug));
  }

  console.log(`👤 ${socket.user?.username || 'Unknown'} left room: ${roomSlug} (${roomUsers.size} users)`);
}

/**
 * Get active room stats
 */
function getStats() {
  const stats = {
    totalConnections: userSockets.size,
    totalRooms: activeUsers.size,
    rooms: {},
  };

  for (const [roomId, users] of activeUsers.entries()) {
    stats.rooms[roomId] = users.size;
  }

  return stats;
}

/**
 * Broadcast to specific user across all their connections
 */
function broadcastToUser(io, userId, event, data) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
}

module.exports = {
  setupSocketHandlers,
  getStats,
  broadcastToUser,
  getRoomUsers,
};

