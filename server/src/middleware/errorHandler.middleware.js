/**
 * Error Handler Middleware
 * Centralized error handling with proper logging
 */

const config = require('../config/env');
const { ERROR_CODES } = require('../config/constants');

/**
 * Not Found Handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Resource not found',
    code: ERROR_CODES.NOT_FOUND,
    path: req.path,
  });
}

/**
 * Global Error Handler
 */
function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: Object.values(err.errors).map(e => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      error: `${field} already exists`,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = config.isProduction && statusCode === 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: message,
    code: err.code || ERROR_CODES.INTERNAL_ERROR,
    ...(config.isDevelopment && { stack: err.stack }),
  });
}

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
};

