const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();

    // Check for existing username or email
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).get(username, email);

    if (existingUser) {
      const byUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (byUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const defaultAvatar = JSON.stringify({
      bodyColor: '#FFD700',
      shirtColor: '#4A90E2',
      pantsColor: '#2C3E50',
      hatStyle: 'none',
      faceStyle: 'smile',
    });

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, created_at, robux, avatar_data, description)
      VALUES (?, ?, ?, ?, ?, ?, 100, ?, '')
    `).run(userId, username, email, passwordHash, display_name || username, now, defaultAvatar);

    const token = generateToken({ id: userId, username, email });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        username,
        email,
        display_name: display_name || username,
        robux: 100,
        avatar_data: JSON.parse(defaultAvatar),
        description: '',
        created_at: now,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDb();

    // Accept login by username or email
    const user = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(username, username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .run(new Date().toISOString(), user.id);

    const token = generateToken({ id: user.id, username: user.username, email: user.email });

    let avatarData = {};
    try {
      avatarData = JSON.parse(user.avatar_data || '{}');
    } catch {
      avatarData = {};
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        robux: user.robux,
        avatar_data: avatarData,
        description: user.description || '',
        created_at: user.created_at,
        last_login: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - verify token and return current user
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let avatarData = {};
    try {
      avatarData = JSON.parse(user.avatar_data || '{}');
    } catch {
      avatarData = {};
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        robux: user.robux,
        avatar_data: avatarData,
        description: user.description || '',
        created_at: user.created_at,
        last_login: user.last_login,
      },
    });
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
