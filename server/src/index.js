/**
 * Codeverse Server
 * Production-grade collaborative code editor backend
 */

// Handle leveldown errors gracefully (native module may not be available)
// This must be set up before any requires that might load leveldown
const originalEmit = process.emit;
process.emit = function(event, error) {
  if (event === 'uncaughtException' && error && error.message) {
    if (error.message.includes('leveldown') || error.message.includes('No native build')) {
      console.warn('⚠️  LevelDB native module not available, continuing without persistence');
      // Suppress this error - don't let it crash the process
      return true; // Indicates error was handled
    }
  }
  return originalEmit.apply(this, arguments);
};

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Load config first
const config = require('./config/env');

// Import routes
const authRoutes = require('./routes/auth.routes');
const roomsRoutes = require('./routes/rooms.routes');
const judgeRoutes = require('./routes/judge.routes');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler.middleware');

// Import WebSocket handlers
const { setupSocketHandlers, getStats: getSocketStats } = require('./websocket/socketHandler');

// Import services - defer yjs service to avoid leveldown errors on startup
let yjsService = null;
let setupYjsWebSocket = null;
try {
  yjsService = require('./services/yjs.service');
  setupYjsWebSocket = require('./websocket/yjsHandler').setupYjsWebSocket;
} catch (error) {
  console.warn('⚠️  Yjs service not available:', error.message);
  // Create a dummy service
  yjsService = {
    initialize: async () => {},
    getStats: () => ({ loadedDocuments: 0, documentIds: [] }),
    shutdown: async () => {},
  };
  setupYjsWebSocket = () => {};
}

// Initialize Express
const app = express();
const server = http.createServer(app);

// ======================
// Security Middleware
// ======================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging (development only)
if (config.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ======================
// API Routes
// ======================

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Stats endpoint (for monitoring)
app.get('/api/stats', (req, res) => {
  res.json({
    sockets: getSocketStats(),
    yjs: yjsService.getStats(),
    mongodb: {
      connected: mongoose.connection.readyState === 1,
    },
  });
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/judge', judgeRoutes);

// ======================
// Error Handling
// ======================

app.use(notFoundHandler);
app.use(errorHandler);

// ======================
// Socket.IO Setup
// ======================

const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: false,
  },
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// ======================
// Yjs WebSocket Setup
// ======================

if (setupYjsWebSocket) {
  try {
    setupYjsWebSocket(server);
  } catch (error) {
    console.warn('⚠️  Failed to setup Yjs WebSocket:', error.message);
  }
}

// ======================
// Database Connection
// ======================

async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodbUri, config.mongodbOptions);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Server will continue without database');
  }
}

// ======================
// Graceful Shutdown
// ======================

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Close Socket.IO
  io.close(() => {
    console.log('Socket.IO closed');
  });

  // Shutdown Yjs service
  await yjsService.shutdown();

  // Close MongoDB
  await mongoose.connection.close();
  console.log('MongoDB connection closed');

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ======================
// Start Server
// ======================

async function start() {
  // Initialize Yjs persistence (non-blocking, will continue without it if it fails)
  yjsService.initialize().catch((error) => {
    console.error('Failed to initialize Yjs persistence:', error.message);
    console.log('⚠️  Continuing without persistence (in-memory only)');
  });

  // Connect to database (non-blocking)
  connectDatabase();

  // Start HTTP server
  server.listen(config.port, () => {
    console.log('');
    console.log('🚀 Codeverse Server Started');
    console.log('================================');
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Port: ${config.port}`);
    console.log(`API: http://localhost:${config.port}/api`);
    console.log(`Socket.IO: http://localhost:${config.port}`);
    console.log(`Yjs WebSocket: ws://localhost:${config.port}/yjs`);
    console.log(`Health: http://localhost:${config.port}/health`);
    console.log('================================');
    console.log('');
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = { app, server, io };

