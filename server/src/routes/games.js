const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/games - list games with optional filtering
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, sort = 'players_online', limit = 20, offset = 0 } = req.query;

    const db = getDb();

    const allowedSorts = ['players_online', 'rating', 'plays', 'created_at', 'title'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'players_online';

    let query = 'SELECT * FROM games WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY ${sortCol} DESC`;
    query += ' LIMIT ? OFFSET ?';
    params.push(Math.min(parseInt(limit) || 20, 100), parseInt(offset) || 0);

    const games = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM games WHERE 1=1';
    const countParams = [];
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      games,
      pagination: {
        total,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        has_more: (parseInt(offset) || 0) + games.length < total,
      },
    });
  } catch (err) {
    console.error('List games error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/games/mine - get games created by the authenticated user
router.get('/mine', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const games = db.prepare(
      'SELECT * FROM games WHERE created_by = ? ORDER BY created_at DESC'
    ).all(req.user.id);
    res.json({ games });
  } catch (err) {
    console.error('Get my games error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/games/categories - get all categories with counts
router.get('/categories', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT
        category,
        COUNT(*) as game_count,
        SUM(players_online) as total_players
      FROM games
      GROUP BY category
      ORDER BY total_players DESC
    `).all();

    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/games/featured - get featured/popular games
router.get('/featured', (req, res) => {
  try {
    const db = getDb();

    // Get top game per category by players_online
    const featured = db.prepare(`
      SELECT g1.* FROM games g1
      INNER JOIN (
        SELECT category, MAX(players_online) as max_players
        FROM games GROUP BY category
      ) g2 ON g1.category = g2.category AND g1.players_online = g2.max_players
      ORDER BY g1.players_online DESC
    `).all();

    // Also get overall top 4
    const trending = db.prepare(
      'SELECT * FROM games ORDER BY players_online DESC LIMIT 4'
    ).all();

    res.json({ featured, trending });
  } catch (err) {
    console.error('Get featured error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games - create a new game
router.post('/', authenticateToken, (req, res) => {
  try {
    const {
      title,
      description = '',
      category,
      game_type,
      max_players = 10,
      thumbnail_color = '#0066ff',
      thumbnail_emoji = '🎮',
    } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 50) {
      return res.status(400).json({ error: 'Title must be between 3 and 50 characters' });
    }

    // Validate category
    const validCategories = ['Adventure', 'Obby', 'Roleplay', 'Fighting', 'Simulator', 'Racing'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ error: 'Category must be one of: ' + validCategories.join(', ') });
    }

    // Validate game_type
    const validGameTypes = ['obby', 'sandbox', 'racing'];
    if (!game_type || !validGameTypes.includes(game_type)) {
      return res.status(400).json({ error: 'game_type must be one of: obby, sandbox, racing' });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const clampedMax = Math.min(Math.max(parseInt(max_players) || 10, 2), 20);

    db.prepare(`
      INSERT INTO games (id, title, description, thumbnail, category, game_type, max_players, thumbnail_color, thumbnail_emoji, created_by, players_online, rating, plays, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
    `).run(
      id,
      title.trim(),
      (description || '').trim(),
      '',
      category,
      game_type,
      clampedMax,
      thumbnail_color || '#0066ff',
      thumbnail_emoji || '🎮',
      req.user.id,
      now
    );

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    // Create notification for the creator
    const notifId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data, read, created_at)
      VALUES (?, ?, 'game', ?, ?, ?, 0, ?)
    `).run(
      notifId,
      req.user.id,
      'Game Published!',
      `Your game '${title.trim()}' is now live!`,
      JSON.stringify({ game_id: id }),
      now
    );

    res.status(201).json({ game });
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/games/:id - update a game (only creator)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this game' });
    }

    const {
      title,
      description,
      category,
      game_type,
      max_players,
      thumbnail_color,
      thumbnail_emoji,
    } = req.body;

    if (title !== undefined && (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 50)) {
      return res.status(400).json({ error: 'Title must be between 3 and 50 characters' });
    }

    const validCategories = ['Adventure', 'Obby', 'Roleplay', 'Fighting', 'Simulator', 'Racing'];
    if (category !== undefined && !validCategories.includes(category)) {
      return res.status(400).json({ error: 'Category must be one of: ' + validCategories.join(', ') });
    }

    const validGameTypes = ['obby', 'sandbox', 'racing'];
    if (game_type !== undefined && !validGameTypes.includes(game_type)) {
      return res.status(400).json({ error: 'game_type must be one of: obby, sandbox, racing' });
    }

    const updatedTitle          = (title !== undefined) ? title.trim() : game.title;
    const updatedDescription    = (description !== undefined) ? description.trim() : game.description;
    const updatedCategory       = (category !== undefined) ? category : game.category;
    const updatedGameType       = (game_type !== undefined) ? game_type : game.game_type;
    const updatedMaxPlayers     = (max_players !== undefined) ? Math.min(Math.max(parseInt(max_players) || 10, 2), 20) : game.max_players;
    const updatedColor          = (thumbnail_color !== undefined) ? thumbnail_color : game.thumbnail_color;
    const updatedEmoji          = (thumbnail_emoji !== undefined) ? thumbnail_emoji : game.thumbnail_emoji;

    db.prepare(`
      UPDATE games SET title=?, description=?, category=?, game_type=?, max_players=?, thumbnail_color=?, thumbnail_emoji=?
      WHERE id=?
    `).run(updatedTitle, updatedDescription, updatedCategory, updatedGameType, updatedMaxPlayers, updatedColor, updatedEmoji, req.params.id);

    const updated = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    res.json({ game: updated });
  } catch (err) {
    console.error('Update game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/games/:id - delete a game (only creator)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this game' });
    }

    db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.error('Delete game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/games/:id - get single game details
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get current active session count
    const sessionCount = db.prepare(
      'SELECT COUNT(*) as count FROM game_sessions WHERE game_id = ?'
    ).get(game.id);

    res.json({
      game: {
        ...game,
        active_sessions: sessionCount.count,
      },
    });
  } catch (err) {
    console.error('Get game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/:id/join - join a game (auth required)
router.post('/:id/join', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if already in session
    const existingSession = db.prepare(
      'SELECT id FROM game_sessions WHERE game_id = ? AND user_id = ?'
    ).get(game.id, req.user.id);

    if (existingSession) {
      return res.json({
        message: 'Already in this game',
        session_id: existingSession.id,
        game,
      });
    }

    // Check player capacity
    const sessionCount = db.prepare(
      'SELECT COUNT(*) as count FROM game_sessions WHERE game_id = ?'
    ).get(game.id);

    if (sessionCount.count >= game.max_players) {
      return res.status(409).json({ error: 'Game is full' });
    }

    const sessionId = uuidv4();
    db.prepare(`
      INSERT INTO game_sessions (id, game_id, user_id, joined_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, game.id, req.user.id, new Date().toISOString());

    // Increment play count
    db.prepare('UPDATE games SET plays = plays + 1 WHERE id = ?').run(game.id);

    // Increment live players_online count
    db.prepare('UPDATE games SET players_online = players_online + 1 WHERE id = ?').run(game.id);

    const updatedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(game.id);

    res.status(201).json({
      message: `Joined ${game.title}`,
      session_id: sessionId,
      game: updatedGame,
    });
  } catch (err) {
    console.error('Join game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/:id/leave - leave a game (auth required)
router.post('/:id/leave', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const session = db.prepare(
      'SELECT id FROM game_sessions WHERE game_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!session) {
      return res.status(404).json({ error: 'Not currently in this game' });
    }

    db.prepare('DELETE FROM game_sessions WHERE id = ?').run(session.id);

    // Decrement players_online (floor at 0)
    db.prepare(`
      UPDATE games SET players_online = MAX(0, players_online - 1) WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'Left game successfully' });
  } catch (err) {
    console.error('Leave game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
