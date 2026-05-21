const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:username - get public profile
router.get('/:username', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(
      'SELECT id, username, display_name, robux, avatar_data, description, created_at, last_login FROM users WHERE username = ?'
    ).get(req.params.username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let avatarData = {};
    try {
      avatarData = JSON.parse(user.avatar_data || '{}');
    } catch {
      avatarData = {};
    }

    // Get friend count
    const friendCount = db.prepare(`
      SELECT COUNT(*) as count FROM friendships
      WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
    `).get(user.id, user.id);

    res.json({
      user: {
        ...user,
        avatar_data: avatarData,
        friend_count: friendCount.count,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile - update own profile (auth required)
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { display_name, description } = req.body;
    const db = getDb();

    const updates = [];
    const values = [];

    if (display_name !== undefined) {
      if (display_name.length < 1 || display_name.length > 50) {
        return res.status(400).json({ error: 'Display name must be between 1 and 50 characters' });
      }
      updates.push('display_name = ?');
      values.push(display_name);
    }

    if (description !== undefined) {
      if (description.length > 500) {
        return res.status(400).json({ error: 'Description cannot exceed 500 characters' });
      }
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare(
      'SELECT id, username, email, display_name, robux, avatar_data, description, created_at, last_login FROM users WHERE id = ?'
    ).get(req.user.id);

    let avatarData = {};
    try {
      avatarData = JSON.parse(updated.avatar_data || '{}');
    } catch {
      avatarData = {};
    }

    res.json({
      message: 'Profile updated',
      user: { ...updated, avatar_data: avatarData },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/avatar - update avatar (auth required)
router.put('/avatar', authenticateToken, (req, res) => {
  try {
    const { avatar_data } = req.body;

    if (!avatar_data || typeof avatar_data !== 'object') {
      return res.status(400).json({ error: 'avatar_data must be an object' });
    }

    // Validate avatar fields
    const allowedFields = ['bodyColor', 'shirtColor', 'pantsColor', 'hatStyle', 'faceStyle', 'accessory'];
    const sanitized = {};
    for (const key of allowedFields) {
      if (avatar_data[key] !== undefined) {
        sanitized[key] = avatar_data[key];
      }
    }

    const db = getDb();
    db.prepare('UPDATE users SET avatar_data = ? WHERE id = ?')
      .run(JSON.stringify(sanitized), req.user.id);

    res.json({
      message: 'Avatar updated',
      avatar_data: sanitized,
    });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/me/friends - get own friend list (auth required)
router.get('/me/friends', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const friends = db.prepare(`
      SELECT
        u.id, u.username, u.display_name, u.avatar_data, u.last_login,
        f.status, f.created_at as friendship_since,
        CASE WHEN f.user_id = ? THEN 'sent' ELSE 'received' END as direction
      FROM friendships f
      JOIN users u ON (
        CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END = u.id
      )
      WHERE f.user_id = ? OR f.friend_id = ?
      ORDER BY f.status DESC, f.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);

    const result = friends.map(f => {
      let avatarData = {};
      try { avatarData = JSON.parse(f.avatar_data || '{}'); } catch {}
      return { ...f, avatar_data: avatarData };
    });

    res.json({ friends: result });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/friends/request - send friend request (auth required)
router.post('/friends/request', authenticateToken, (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = getDb();
    const targetUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists in either direction
    const existing = db.prepare(`
      SELECT id, status FROM friendships
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(req.user.id, targetUser.id, targetUser.id, req.user.id);

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: 'Already friends' });
      }
      return res.status(409).json({ error: 'Friend request already pending' });
    }

    const friendshipId = uuidv4();
    db.prepare(`
      INSERT INTO friendships (id, user_id, friend_id, status, created_at)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(friendshipId, req.user.id, targetUser.id, new Date().toISOString());

    res.status(201).json({ message: `Friend request sent to ${targetUser.username}` });
  } catch (err) {
    console.error('Friend request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/friends/accept - accept friend request (auth required)
router.put('/friends/accept', authenticateToken, (req, res) => {
  try {
    const { friendship_id } = req.body;

    if (!friendship_id) {
      return res.status(400).json({ error: 'friendship_id is required' });
    }

    const db = getDb();
    const friendship = db.prepare(
      "SELECT * FROM friendships WHERE id = ? AND friend_id = ? AND status = 'pending'"
    ).get(friendship_id, req.user.id);

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(friendship_id);

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Accept friend error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/friends/:friendshipId - remove friend (auth required)
router.delete('/friends/:friendshipId', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const friendship = db.prepare(
      'SELECT * FROM friendships WHERE id = ? AND (user_id = ? OR friend_id = ?)'
    ).get(req.params.friendshipId, req.user.id, req.user.id);

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    db.prepare('DELETE FROM friendships WHERE id = ?').run(req.params.friendshipId);

    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
