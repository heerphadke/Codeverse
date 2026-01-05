/**
 * Room Model
 * Stores room metadata and access control
 * NOTE: Actual file content is stored in Yjs (CRDT), not here
 */

const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.EDITOR,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  // Unique room identifier (used in URLs)
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: [/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, underscores, and hyphens'],
  },
  // Human-readable name
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  // Room description
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  // Owner (creator) of the room
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Members with their roles
  members: [memberSchema],
  // Room settings
  settings: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowAnonymous: {
      type: Boolean,
      default: false,
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 50,
    },
    defaultLanguage: {
      type: String,
      default: 'javascript',
    },
  },
  // Access token for invite links
  inviteToken: {
    type: String,
    default: null,
  },
  inviteTokenExpiresAt: {
    type: Date,
    default: null,
  },
  // Room status
  isActive: {
    type: Boolean,
    default: true,
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes (slug already has unique: true)
roomSchema.index({ owner: 1 });
roomSchema.index({ 'members.user': 1 });
roomSchema.index({ inviteToken: 1 });
roomSchema.index({ isActive: 1, lastActivityAt: -1 });

// Virtual for member count
roomSchema.virtual('memberCount').get(function() {
  return this.members.length + 1; // +1 for owner
});

// Check if user has access to room
roomSchema.methods.hasAccess = function(userId) {
  if (!userId) return this.settings.isPublic;
  
  const userIdStr = userId.toString();
  if (this.owner.toString() === userIdStr) return true;
  
  return this.members.some(m => m.user.toString() === userIdStr);
};

// Get user's role in room
roomSchema.methods.getUserRole = function(userId) {
  if (!userId) return null;
  
  const userIdStr = userId.toString();
  if (this.owner.toString() === userIdStr) return ROLES.OWNER;
  
  const member = this.members.find(m => m.user.toString() === userIdStr);
  return member ? member.role : null;
};

// Check if user can perform action
roomSchema.methods.canPerform = function(userId, action) {
  const role = this.getUserRole(userId);
  if (!role) return false;
  
  const { PERMISSIONS } = require('../config/constants');
  return PERMISSIONS[role]?.includes(action) || false;
};

// Add member to room
roomSchema.methods.addMember = function(userId, role = ROLES.EDITOR) {
  if (this.hasAccess(userId)) {
    throw new Error('User is already a member');
  }
  
  if (this.members.length >= this.settings.maxMembers - 1) {
    throw new Error('Room is full');
  }
  
  this.members.push({ user: userId, role });
};

// Remove member from room
roomSchema.methods.removeMember = function(userId) {
  const userIdStr = userId.toString();
  if (this.owner.toString() === userIdStr) {
    throw new Error('Cannot remove room owner');
  }
  
  const index = this.members.findIndex(m => m.user.toString() === userIdStr);
  if (index === -1) {
    throw new Error('User is not a member');
  }
  
  this.members.splice(index, 1);
};

// Update member role
roomSchema.methods.updateMemberRole = function(userId, newRole) {
  const userIdStr = userId.toString();
  if (this.owner.toString() === userIdStr) {
    throw new Error('Cannot change owner role');
  }
  
  const member = this.members.find(m => m.user.toString() === userIdStr);
  if (!member) {
    throw new Error('User is not a member');
  }
  
  member.role = newRole;
};

// Generate invite token
roomSchema.methods.generateInviteToken = function(expiresInHours = 24) {
  const crypto = require('crypto');
  this.inviteToken = crypto.randomBytes(32).toString('hex');
  this.inviteTokenExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  return this.inviteToken;
};

// Validate invite token
roomSchema.methods.isInviteTokenValid = function(token) {
  if (!this.inviteToken || !this.inviteTokenExpiresAt) return false;
  if (this.inviteToken !== token) return false;
  return this.inviteTokenExpiresAt > new Date();
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;

