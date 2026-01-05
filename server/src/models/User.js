/**
 * User Model
 * Stores user accounts with secure password hashing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null,
  },
  color: {
    type: String,
    default: '#4ECDC4',
  },
  // OAuth fields
  oauthProvider: {
    type: String,
    enum: ['local', 'github', 'google'],
    default: 'local',
  },
  oauthId: {
    type: String,
    default: null,
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  // Refresh token for JWT rotation
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Compound index for OAuth lookups (simple fields already have unique: true)
userSchema.index({ oauthProvider: 1, oauthId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  
  return user;
};

// Clean up expired refresh tokens
userSchema.methods.cleanExpiredTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(t => t.expiresAt > now);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

