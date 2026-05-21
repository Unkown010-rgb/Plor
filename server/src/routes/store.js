const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// GET /api/store/items - list all store items, optional ?category= filter
router.get('/items', (req, res) => {
  try {
    const db = getDb();
    const { category } = req.query;

    let items;
    if (category) {
      items = db.prepare(
        'SELECT * FROM store_items WHERE category = ? ORDER BY price ASC'
      ).all(category);
    } else {
      items = db.prepare('SELECT * FROM store_items ORDER BY category ASC, price ASC').all();
    }

    res.json({ items });
  } catch (err) {
    console.error('Get store items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/store/gamepasses - list all gamepasses, optional ?game_id= filter
router.get('/gamepasses', (req, res) => {
  try {
    const db = getDb();
    const { game_id } = req.query;

    let gamepasses;
    if (game_id) {
      gamepasses = db.prepare(
        "SELECT * FROM gamepasses WHERE game_id = ? OR game_id = 'all' ORDER BY price ASC"
      ).all(game_id);
    } else {
      gamepasses = db.prepare('SELECT * FROM gamepasses ORDER BY game_id ASC, price ASC').all();
    }

    res.json({ gamepasses });
  } catch (err) {
    console.error('Get gamepasses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/store/inventory - get user's purchased items (auth required)
router.get('/inventory', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const purchases = db.prepare(`
      SELECT p.*,
        CASE
          WHEN p.item_type = 'store_item' THEN si.name
          WHEN p.item_type = 'gamepass'   THEN gp.title
        END as item_name,
        CASE
          WHEN p.item_type = 'store_item' THEN si.icon
          WHEN p.item_type = 'gamepass'   THEN gp.icon
        END as item_icon,
        CASE
          WHEN p.item_type = 'store_item' THEN si.category
          WHEN p.item_type = 'gamepass'   THEN gp.game_id
        END as item_category
      FROM purchases p
      LEFT JOIN store_items si ON p.item_type = 'store_item' AND p.item_id = si.id
      LEFT JOIN gamepasses gp  ON p.item_type = 'gamepass'   AND p.item_id = gp.id
      WHERE p.user_id = ?
      ORDER BY p.purchased_at DESC
    `).all(req.user.id);

    res.json({ purchases });
  } catch (err) {
    console.error('Get inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/store/purchase - purchase an item or gamepass (auth required)
router.post('/purchase', authenticateToken, (req, res) => {
  try {
    const { item_id, item_type } = req.body;

    if (!item_id || !item_type) {
      return res.status(400).json({ error: 'item_id and item_type are required' });
    }
    if (!['gamepass', 'store_item'].includes(item_type)) {
      return res.status(400).json({ error: "item_type must be 'gamepass' or 'store_item'" });
    }

    const db = getDb();

    // Look up the item and its price
    let item;
    if (item_type === 'gamepass') {
      item = db.prepare('SELECT * FROM gamepasses WHERE id = ?').get(item_id);
    } else {
      item = db.prepare('SELECT * FROM store_items WHERE id = ?').get(item_id);
    }

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if already owned
    const alreadyOwned = db.prepare(
      'SELECT id FROM purchases WHERE user_id = ? AND item_id = ? AND item_type = ?'
    ).get(req.user.id, item_id, item_type);

    if (alreadyOwned) {
      return res.status(409).json({ error: 'You already own this item' });
    }

    // Get fresh user balance
    const user = db.prepare('SELECT id, robux FROM users WHERE id = ?').get(req.user.id);
    const price = item_type === 'gamepass' ? item.price : item.price;

    if (user.robux < price) {
      return res.status(400).json({
        error: 'Insufficient Plor balance',
        required: price,
        balance: user.robux,
      });
    }

    const itemName = item_type === 'gamepass' ? item.title : item.name;

    // Perform purchase atomically
    const purchaseId = uuidv4();
    const now = new Date().toISOString();

    db.transaction(() => {
      // Deduct balance
      db.prepare('UPDATE users SET robux = robux - ? WHERE id = ?').run(price, req.user.id);

      // Record purchase
      db.prepare(`
        INSERT INTO purchases (id, user_id, item_id, item_type, price_paid, purchased_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(purchaseId, req.user.id, item_id, item_type, price, now);

      // Create notification
      createNotification(
        db,
        req.user.id,
        'purchase',
        'Purchase successful!',
        `You purchased "${itemName}" for ${price} Plor.`,
        JSON.stringify({ purchase_id: purchaseId, item_id, item_type, item_name: itemName, price })
      );
    })();

    const updatedUser = db.prepare('SELECT robux FROM users WHERE id = ?').get(req.user.id);

    res.status(201).json({
      message: 'Purchase successful!',
      purchase: {
        id: purchaseId,
        item_id,
        item_type,
        item_name: itemName,
        price_paid: price,
        purchased_at: now,
      },
      new_balance: updatedUser.robux,
    });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/store/featured - return 6 featured items (mixed gamepasses + store items)
router.get('/featured', (req, res) => {
  try {
    const db = getDb();

    // 3 featured gamepasses (highest priced generic ones first, then others)
    const featuredGamepasses = db.prepare(`
      SELECT *, 'gamepass' as source_type FROM gamepasses
      ORDER BY CASE WHEN game_id = 'all' THEN 0 ELSE 1 END ASC, price DESC
      LIMIT 3
    `).all();

    // 3 featured store items (rarity ordering: epic > rare > uncommon > common)
    const featuredItems = db.prepare(`
      SELECT *, 'store_item' as source_type FROM store_items
      ORDER BY CASE rarity
        WHEN 'epic'     THEN 1
        WHEN 'rare'     THEN 2
        WHEN 'uncommon' THEN 3
        ELSE 4
      END ASC, price DESC
      LIMIT 3
    `).all();

    res.json({
      featured: [
        ...featuredGamepasses.map(gp => ({ ...gp, featured_type: 'gamepass' })),
        ...featuredItems.map(si => ({ ...si, featured_type: 'store_item' })),
      ],
    });
  } catch (err) {
    console.error('Get featured error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
