/**
 * Authentication Middleware
 * Protects routes and Socket.IO connections
 */

const { authService, AuthError } = require('../services/auth.service');
const { ERROR_CODES } = require('../config/constants');

/**
 * Extract token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Express middleware - Require authentication
 */
function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    const payload = authService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: error.message,
        code: error.code,
      });
    }
    return res.status(401).json({
      error: 'Authentication failed',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }
}

/**
 * Express middleware - Optional authentication
 * Attaches user if token is valid, but doesn't require it
 */
function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = authService.verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
}

/**
 * Socket.IO middleware - Authenticate connections
 */
function socketAuth(socket, next) {
  try {
    // Token can be in auth object or query params
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = authService.verifyAccessToken(token);
    socket.user = payload;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
}

/**
 * Socket.IO middleware - Optional authentication
 */
function socketOptionalAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (token) {
      const payload = authService.verifyAccessToken(token);
      socket.user = payload;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
}

/**
 * Room access middleware factory
 * Checks if user has required permission for room
 */
function requireRoomAccess(permission) {
  const Room = require('../models/Room');
  
  return async (req, res, next) => {
    try {
      const roomSlug = req.params.roomSlug || req.params.slug;
      if (!roomSlug) {
        return res.status(400).json({
          error: 'Room identifier required',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const room = await Room.findOne({ slug: roomSlug, isActive: true });
      if (!room) {
        return res.status(404).json({
          error: 'Room not found',
          code: ERROR_CODES.NOT_FOUND,
        });
      }

      // Check access
      const userId = req.user?.userId;
      if (!room.hasAccess(userId)) {
        return res.status(403).json({
          error: 'Access denied',
          code: ERROR_CODES.FORBIDDEN,
        });
      }

      // Check specific permission if provided
      if (permission && !room.canPerform(userId, permission)) {
        return res.status(403).json({
          error: `Permission denied: ${permission}`,
          code: ERROR_CODES.FORBIDDEN,
        });
      }

      // Attach room to request
      req.room = room;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  extractToken,
  requireAuth,
  optionalAuth,
  socketAuth,
  socketOptionalAuth,
  requireRoomAccess,
};

