/**
 * Authentication Service
 * Handles JWT token generation, validation, and refresh
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { ERROR_CODES } = require('../config/constants');

class AuthService {
  /**
   * Generate access token
   */
  generateAccessToken(user) {
    const payload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
      issuer: 'codeverse',
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user._id.toString(),
      type: 'refresh',
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
      issuer: 'codeverse',
    });
  }

  /**
   * Generate both tokens
   */
  generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'codeverse',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthError('Access token expired', ERROR_CODES.UNAUTHORIZED);
      }
      throw new AuthError('Invalid access token', ERROR_CODES.UNAUTHORIZED);
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'codeverse',
      });
      
      if (payload.type !== 'refresh') {
        throw new AuthError('Invalid token type', ERROR_CODES.UNAUTHORIZED);
      }
      
      return payload;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Invalid refresh token', ERROR_CODES.UNAUTHORIZED);
    }
  }

  /**
   * Register new user
   */
  async register({ username, email, password }) {
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AuthError('Email already registered', ERROR_CODES.VALIDATION_ERROR);
      }
      throw new AuthError('Username already taken', ERROR_CODES.VALIDATION_ERROR);
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      color: this.generateUserColor(username),
    });

    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user._id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login({ email, password }) {
    const user = await User.findByCredentials(email, password);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user._id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken) {
    const payload = this.verifyRefreshToken(refreshToken);
    
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AuthError('User not found or inactive', ERROR_CODES.UNAUTHORIZED);
    }

    // Verify token is stored (prevents reuse of old tokens)
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      // Possible token reuse attack - invalidate all tokens
      user.refreshTokens = [];
      await user.save();
      throw new AuthError('Invalid refresh token', ERROR_CODES.UNAUTHORIZED);
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    await this.storeRefreshToken(user._id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId, refreshToken) {
    await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await User.updateOne(
      { _id: userId },
      { $set: { refreshTokens: [] } }
    );
  }

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(userId, token) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await User.updateOne(
      { _id: userId },
      {
        $push: {
          refreshTokens: {
            token,
            expiresAt,
            createdAt: new Date(),
          },
        },
      }
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AuthError('User not found', ERROR_CODES.NOT_FOUND);
    }
    return user;
  }

  /**
   * Generate consistent color for username
   */
  generateUserColor(username) {
    const { USER_COLORS } = require('../config/constants');
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  }
}

/**
 * Custom Auth Error
 */
class AuthError extends Error {
  constructor(message, code = ERROR_CODES.UNAUTHORIZED) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

module.exports = {
  authService: new AuthService(),
  AuthError,
};

