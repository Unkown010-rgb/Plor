const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper to insert a notification row.
 * Exported so other route files can import and call it.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} userId  - recipient user id
 * @param {string} type    - e.g. 'friend_request', 'purchase', etc.
 * @param {string} title
 * @param {string} [message]
 * @param {string} [data]  - JSON-stringified extra payload
 * @returns {string} the new notification id
 */
function createNotification(db, userId, type, title, message = null, data = null) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, data, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(id, userId, type, title, message, data, new Date().toISOString());
  return id;
}

// GET /api/notifications - get the authenticated user's notifications, newest first
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    // Parse the optional JSON data field
    const result = notifications.map(n => ({
      ...n,
      read: n.read === 1,
      data: n.data ? (() => { try { return JSON.parse(n.data); } catch { return n.data; } })() : null,
    }));

    const unread_count = result.filter(n => !n.read).length;

    res.json({ notifications: result, unread_count });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/read-all - mark all notifications as read
// Must be defined before /:id routes to avoid route collision
router.put('/read-all', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Read-all notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/:id/read - mark a single notification as read
router.put('/:id/read', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const notification = db.prepare(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/notifications/:id - delete a notification
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const notification = db.prepare(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
