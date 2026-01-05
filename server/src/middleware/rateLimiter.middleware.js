/**
 * Rate Limiting Middleware
 * Protects against abuse for REST and Socket.IO
 */

const config = require('../config/env');
const { ERROR_CODES } = require('../config/constants');

/**
 * In-memory rate limiter store
 * For production, use Redis-backed store
 */
class RateLimiterStore {
  constructor() {
    this.store = new Map();
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  delete(key) {
    this.store.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.windowStart + value.windowMs < now) {
        this.store.delete(key);
      }
    }
  }
}

const store = new RateLimiterStore();

/**
 * Create rate limiter middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
    keyGenerator = (req) => req.ip || req.user?.userId || 'anonymous',
    handler = null,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
  } = options;

  return (req, res, next) => {
    const key = `ratelimit:${keyGenerator(req)}`;
    const now = Date.now();

    let record = store.get(key);

    // Initialize or reset window
    if (!record || record.windowStart + windowMs < now) {
      record = {
        count: 0,
        windowStart: now,
        windowMs,
      };
    }

    // Check if rate limited
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000);
      
      res.set('Retry-After', retryAfter);
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', 0);
      res.set('X-RateLimit-Reset', new Date(record.windowStart + windowMs).toISOString());

      if (handler) {
        return handler(req, res, next);
      }

      return res.status(429).json({
        error: 'Too many requests, please try again later',
        code: ERROR_CODES.RATE_LIMITED,
        retryAfter,
      });
    }

    // Increment count
    record.count++;
    store.set(key, record);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.set('X-RateLimit-Reset', new Date(record.windowStart + windowMs).toISOString());

    // Handle skip options
    if (skipFailedRequests || skipSuccessfulRequests) {
      const originalEnd = res.end;
      res.end = function(...args) {
        if (skipFailedRequests && res.statusCode >= 400) {
          record.count--;
          store.set(key, record);
        }
        if (skipSuccessfulRequests && res.statusCode < 400) {
          record.count--;
          store.set(key, record);
        }
        originalEnd.apply(res, args);
      };
    }

    next();
  };
}

/**
 * Socket.IO rate limiter
 */
class SocketRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 1000; // 1 second default
    this.maxEvents = options.maxEvents || 50; // 50 events per second
    this.clients = new Map();
  }

  /**
   * Check if socket is rate limited
   */
  isRateLimited(socketId) {
    const now = Date.now();
    let record = this.clients.get(socketId);

    if (!record || record.windowStart + this.windowMs < now) {
      record = {
        count: 0,
        windowStart: now,
      };
    }

    record.count++;
    this.clients.set(socketId, record);

    return record.count > this.maxEvents;
  }

  /**
   * Remove socket from tracking
   */
  remove(socketId) {
    this.clients.delete(socketId);
  }

  /**
   * Socket.IO middleware
   */
  middleware() {
    return (socket, next) => {
      const originalOnEvent = socket.onevent;
      
      socket.onevent = (packet) => {
        if (this.isRateLimited(socket.id)) {
          socket.emit('error', {
            message: 'Rate limited',
            code: ERROR_CODES.RATE_LIMITED,
          });
          return;
        }
        originalOnEvent.call(socket, packet);
      };

      socket.on('disconnect', () => {
        this.remove(socket.id);
      });

      next();
    };
  }
}

// Pre-configured limiters
const apiLimiter = createRateLimiter();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per 15 min
  keyGenerator: (req) => `auth:${req.ip}`,
});

const codeExecutionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: config.rateLimit.codeExecLimit,
  keyGenerator: (req) => `exec:${req.user?.userId || req.ip}`,
});

const socketRateLimiter = new SocketRateLimiter();

module.exports = {
  createRateLimiter,
  SocketRateLimiter,
  apiLimiter,
  authLimiter,
  codeExecutionLimiter,
  socketRateLimiter,
};

