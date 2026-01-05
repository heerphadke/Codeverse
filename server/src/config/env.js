/**
 * Environment Configuration
 * Centralized config with validation - no magic constants
 */

require('dotenv').config();

const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

// Validate required env vars in production
if (process.env.NODE_ENV === 'production') {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5001,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/codeverse',
  mongodbOptions: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Judge0
  judge0: {
    apiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
    apiKey: process.env.JUDGE0_API_KEY || '',
    timeout: 30000,
    cpuTimeLimit: 10,
    memoryLimit: 128000,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    codeExecLimit: parseInt(process.env.CODE_EXEC_RATE_LIMIT, 10) || 10,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  },

  // Yjs Persistence
  yjs: {
    persistenceDir: process.env.YJS_PERSISTENCE_DIR || './data/yjs-docs',
  },

  // Room Settings
  room: {
    maxUsers: 10,
    maxFiles: 50,
    maxFileSize: 1024 * 1024, // 1MB
  },
};

// Warn about insecure defaults in development
if (config.isDevelopment) {
  if (config.jwt.accessSecret.includes('dev-')) {
    console.warn('⚠️  Using default JWT secrets - DO NOT use in production');
  }
}

module.exports = config;

