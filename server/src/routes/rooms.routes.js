/**
 * Room Routes
 * Handles room creation, management, and access control
 */

const express = require('express');
const crypto = require('crypto');
const Room = require('../models/Room');
const { requireAuth, requireRoomAccess } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');
const { ROLES, ERROR_CODES } = require('../config/constants');

const router = express.Router();

/**
 * Generate unique room slug
 */
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  
  const suffix = crypto.randomBytes(4).toString('hex');
  return `${base}-${suffix}`;
}

/**
 * POST /api/rooms
 * Create a new room
 */
router.post('/', requireAuth, apiLimiter, async (req, res, next) => {
  try {
    const { name, description, isPublic = false, defaultLanguage = 'javascript' } = req.body;

    if (!name || name.trim().length < 1) {
      return res.status(400).json({
        error: 'Room name is required',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const slug = generateSlug(name);

    const room = new Room({
      slug,
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user.userId,
      members: [],
      settings: {
        isPublic,
        defaultLanguage,
      },
    });

    await room.save();

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: room._id,
        slug: room.slug,
        name: room.name,
        description: room.description,
        settings: room.settings,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate slug - regenerate and retry
      return res.status(500).json({
        error: 'Failed to generate unique room ID, please try again',
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    }
    next(error);
  }
});

/**
 * GET /api/rooms
 * List user's rooms
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rooms = await Room.find({
      $or: [
        { owner: req.user.userId },
        { 'members.user': req.user.userId },
      ],
      isActive: true,
    })
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'username avatar color')
      .lean();

    const total = await Room.countDocuments({
      $or: [
        { owner: req.user.userId },
        { 'members.user': req.user.userId },
      ],
      isActive: true,
    });

    res.json({
      rooms: rooms.map(room => ({
        id: room._id,
        slug: room.slug,
        name: room.name,
        description: room.description,
        owner: room.owner,
        memberCount: room.members.length + 1,
        role: room.owner._id.toString() === req.user.userId ? ROLES.OWNER : 
          room.members.find(m => m.user.toString() === req.user.userId)?.role,
        settings: room.settings,
        lastActivityAt: room.lastActivityAt,
        createdAt: room.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rooms/:slug
 * Get room details
 */
router.get('/:slug', requireAuth, requireRoomAccess('read'), async (req, res, next) => {
  try {
    const room = await Room.findOne({ slug: req.params.slug, isActive: true })
      .populate('owner', 'username avatar color')
      .populate('members.user', 'username avatar color');

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      room: {
        id: room._id,
        slug: room.slug,
        name: room.name,
        description: room.description,
        owner: room.owner,
        members: room.members.map(m => ({
          user: m.user,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        role: room.getUserRole(req.user.userId),
        settings: room.settings,
        lastActivityAt: room.lastActivityAt,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/rooms/:slug
 * Update room settings
 */
router.patch('/:slug', requireAuth, requireRoomAccess('manage'), async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;
    const room = req.room;

    if (name) room.name = name.trim();
    if (description !== undefined) room.description = description.trim();
    if (settings) {
      if (settings.isPublic !== undefined) room.settings.isPublic = settings.isPublic;
      if (settings.maxMembers !== undefined) room.settings.maxMembers = settings.maxMembers;
      if (settings.defaultLanguage) room.settings.defaultLanguage = settings.defaultLanguage;
    }

    await room.save();

    res.json({
      message: 'Room updated',
      room: {
        id: room._id,
        slug: room.slug,
        name: room.name,
        description: room.description,
        settings: room.settings,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/rooms/:slug
 * Delete room (owner only)
 */
router.delete('/:slug', requireAuth, requireRoomAccess('delete'), async (req, res, next) => {
  try {
    const room = req.room;
    
    // Soft delete
    room.isActive = false;
    await room.save();

    res.json({ message: 'Room deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rooms/:slug/invite
 * Generate invite link
 */
router.post('/:slug/invite', requireAuth, requireRoomAccess('manage'), async (req, res, next) => {
  try {
    const { expiresInHours = 24 } = req.body;
    const room = req.room;

    const token = room.generateInviteToken(expiresInHours);
    await room.save();

    // Use dynamic client URL - supports both 5173 and 5174 development ports
    const clientUrl = process.env.CLIENT_URL || (req.headers.origin || 'http://localhost:5173');
    res.json({
      inviteToken: token,
      expiresAt: room.inviteTokenExpiresAt,
      inviteUrl: `${clientUrl}/join/${room.slug}?token=${token}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rooms/:slug/join
 * Join room via invite token
 */
router.post('/:slug/join', requireAuth, async (req, res, next) => {
  try {
    const { token } = req.body;
    const room = await Room.findOne({ slug: req.params.slug, isActive: true });

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    }

    // Check if already a member
    if (room.hasAccess(req.user.userId)) {
      return res.json({
        message: 'Already a member',
        room: { slug: room.slug, name: room.name },
      });
    }

    // Check invite token for private rooms
    if (!room.settings.isPublic) {
      if (!token || !room.isInviteTokenValid(token)) {
        return res.status(403).json({
          error: 'Invalid or expired invite token',
          code: ERROR_CODES.FORBIDDEN,
        });
      }
    }

    // Add as member
    room.addMember(req.user.userId, ROLES.EDITOR);
    await room.save();

    res.json({
      message: 'Joined room successfully',
      room: { slug: room.slug, name: room.name },
    });
  } catch (error) {
    if (error.message === 'Room is full') {
      return res.status(403).json({
        error: error.message,
        code: ERROR_CODES.ROOM_FULL,
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/rooms/:slug/members/:userId
 * Remove member from room
 */
router.delete('/:slug/members/:userId', requireAuth, requireRoomAccess('manage'), async (req, res, next) => {
  try {
    const room = req.room;
    room.removeMember(req.params.userId);
    await room.save();

    res.json({ message: 'Member removed' });
  } catch (error) {
    if (error.message.includes('Cannot remove') || error.message.includes('not a member')) {
      return res.status(400).json({
        error: error.message,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    next(error);
  }
});

/**
 * PATCH /api/rooms/:slug/members/:userId
 * Update member role
 */
router.patch('/:slug/members/:userId', requireAuth, requireRoomAccess('manage'), async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!Object.values(ROLES).includes(role) || role === ROLES.OWNER) {
      return res.status(400).json({
        error: 'Invalid role',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const room = req.room;
    room.updateMemberRole(req.params.userId, role);
    await room.save();

    res.json({ message: 'Member role updated' });
  } catch (error) {
    if (error.message.includes('Cannot change') || error.message.includes('not a member')) {
      return res.status(400).json({
        error: error.message,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    next(error);
  }
});

module.exports = router;

