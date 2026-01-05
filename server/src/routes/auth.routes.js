/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and logout
 */

const express = require('express');
const { authService, AuthError } = require('../services/auth.service');
const { requireAuth } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { ERROR_CODES } = require('../config/constants');

const router = express.Router();

/**
 * Input validation helpers
 */
function validateEmail(email) {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
}

function validateUsername(username) {
  return username && 
    username.length >= 3 && 
    username.length <= 30 && 
    /^[a-zA-Z0-9_-]+$/.test(username);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    const errors = [];
    if (!validateUsername(username)) {
      errors.push('Username must be 3-30 characters, alphanumeric with _ and -');
    }
    if (!validateEmail(email)) {
      errors.push('Invalid email format');
    }
    if (!validatePassword(password)) {
      errors.push('Password must be at least 8 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: errors,
      });
    }

    const result = await authService.register({ username, email, password });

    res.status(201).json({
      message: 'Registration successful',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const result = await authService.login({ email, password });

    res.json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const result = await authService.refresh(refreshToken);

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: error.message,
        code: error.code,
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(req.user.userId, refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', requireAuth, async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.userId);
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    res.json({ user: user.toJSON() });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    next(error);
  }
});

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { username, avatar, color } = req.body;
    const user = await authService.getUserById(req.user.userId);

    // Validate and update fields
    if (username !== undefined) {
      if (!validateUsername(username)) {
        return res.status(400).json({
          error: 'Invalid username format',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      user.username = username;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    if (color !== undefined) {
      // Validate color format (#RRGGBB)
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return res.status(400).json({
          error: 'Invalid color format (use #RRGGBB)',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      user.color = color;
    }

    await user.save();

    res.json({
      message: 'Profile updated',
      user: user.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Username already taken',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    next(error);
  }
});

module.exports = router;

