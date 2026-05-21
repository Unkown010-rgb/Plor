const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeDatabase, getDb } = require('./database');
const { authenticateToken } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

// Initialize database
initializeDatabase();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Express middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const storeRoutes = require('./routes/store');
const notificationRoutes = require('./routes/notifications');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/games', require('./routes/games'));
app.use('/api/store', storeRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Socket.io Real-Time ────────────────────────────────────────────────────

// Track online users: userId -> { socketId, username, gameId }
const onlineUsers = new Map();
// Track game rooms: gameId -> Set of userIds
const gameRooms = new Map();

// Authenticate Socket.io connections via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    // Allow unauthenticated connections (for spectators / guests)
    socket.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    socket.user = null;
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (user: ${socket.user?.username || 'guest'})`);

  // Mark user online
  if (socket.user) {
    onlineUsers.set(socket.user.id, {
      socketId: socket.id,
      username: socket.user.username,
      gameId: null,
    });
    // Broadcast updated online count
    io.emit('online-status', { online_count: onlineUsers.size });

    // Emit unread notification count to this user on connect
    try {
      const db = getDb();
      const unreadRow = db.prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0"
      ).get(socket.user.id);
      socket.emit('notification-count', { unread_count: unreadRow.count });
    } catch (e) {
      console.error('Error fetching notification count on connect:', e);
    }
  }

  // ── online-status: client requests current online info ──────────────────
  socket.on('online-status', () => {
    socket.emit('online-status', {
      online_count: onlineUsers.size,
      online_users: Array.from(onlineUsers.values()).map(u => ({
        username: u.username,
        gameId: u.gameId,
      })),
    });
  });

  // ── join-game: player enters a game room ────────────────────────────────
  socket.on('join-game', ({ gameId }) => {
    if (!socket.user || !gameId) return;

    const userId = socket.user.id;
    const username = socket.user.username;

    // Leave any previous game room
    const userData = onlineUsers.get(userId);
    if (userData?.gameId && userData.gameId !== gameId) {
      const prevRoom = `game:${userData.gameId}`;
      socket.leave(prevRoom);

      // Update old room player list
      if (gameRooms.has(userData.gameId)) {
        gameRooms.get(userData.gameId).delete(userId);
      }

      io.to(prevRoom).emit('player-left', {
        userId,
        username,
        gameId: userData.gameId,
      });
    }

    // Join the new game room
    const roomName = `game:${gameId}`;
    socket.join(roomName);

    // Update room tracking
    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, new Set());
    }
    gameRooms.get(gameId).add(userId);

    // Update user's current game
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).gameId = gameId;
    }

    // Get current players in this room
    const playersInRoom = Array.from(gameRooms.get(gameId)).map(uid => {
      const u = onlineUsers.get(uid);
      return u ? { userId: uid, username: u.username } : null;
    }).filter(Boolean);

    // Notify others in the room
    socket.to(roomName).emit('player-joined', {
      userId,
      username,
      gameId,
      players_in_room: playersInRoom.length,
    });

    // Confirm join to the connecting player
    socket.emit('joined-game', {
      gameId,
      players: playersInRoom,
    });

    console.log(`${username} joined game room ${gameId}`);
  });

  // ── leave-game: player exits a game room ────────────────────────────────
  socket.on('leave-game', ({ gameId }) => {
    if (!socket.user || !gameId) return;

    const userId = socket.user.id;
    const username = socket.user.username;
    const roomName = `game:${gameId}`;

    socket.leave(roomName);

    if (gameRooms.has(gameId)) {
      gameRooms.get(gameId).delete(userId);
      if (gameRooms.get(gameId).size === 0) {
        gameRooms.delete(gameId);
      }
    }

    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).gameId = null;
    }

    io.to(roomName).emit('player-left', {
      userId,
      username,
      gameId,
    });

    socket.emit('left-game', { gameId });
    console.log(`${username} left game room ${gameId}`);
  });

  // ── game-chat: in-game chat messages ────────────────────────────────────
  socket.on('game-chat', ({ gameId, message }) => {
    if (!socket.user || !gameId || !message) return;

    const trimmed = String(message).trim().slice(0, 256);
    if (!trimmed) return;

    const roomName = `game:${gameId}`;
    const chatPayload = {
      userId: socket.user.id,
      username: socket.user.username,
      message: trimmed,
      gameId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all in the room (including sender)
    io.to(roomName).emit('game-chat', chatPayload);
  });

  // ── player-update: position / state updates ─────────────────────────────
  socket.on('player-update', ({ gameId, position, state }) => {
    if (!socket.user || !gameId) return;

    const roomName = `game:${gameId}`;
    // Broadcast to others in room only (not sender)
    socket.to(roomName).emit('player-update', {
      userId: socket.user.id,
      username: socket.user.username,
      position,
      state,
      timestamp: Date.now(),
    });
  });

  // ── new-notification: server pushes a notification to this socket ───────
  // The client can listen for this event to show real-time toasts/badges.
  // Other server-side code can call emitNotification(userId, payload) below.
  socket.on('new-notification', (payload) => {
    // Client-initiated — ignore (server is the authoritative sender)
  });

  // ── disconnect: clean up ────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);

    if (socket.user) {
      const userId = socket.user.id;
      const userData = onlineUsers.get(userId);

      if (userData?.gameId) {
        const roomName = `game:${userData.gameId}`;
        if (gameRooms.has(userData.gameId)) {
          gameRooms.get(userData.gameId).delete(userId);
          if (gameRooms.get(userData.gameId).size === 0) {
            gameRooms.delete(userData.gameId);
          }
        }
        io.to(roomName).emit('player-left', {
          userId,
          username: userData.username,
          gameId: userData.gameId,
        });
      }

      onlineUsers.delete(userId);
      io.emit('online-status', { online_count: onlineUsers.size });
    }
  });
});

// ─── Start server ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Plor server running on http://localhost:${PORT}`);
  console.log(`Socket.io ready`);
});

/**
 * Push a real-time notification to a specific user's socket (if online).
 * Call this after inserting a notifications row via createNotification().
 *
 * @param {string} userId
 * @param {object} payload - notification object to send to the client
 */
function emitNotification(userId, payload) {
  const userData = onlineUsers.get(userId);
  if (userData?.socketId) {
    io.to(userData.socketId).emit('new-notification', payload);

    // Also refresh their unread count badge
    try {
      const db = getDb();
      const unreadRow = db.prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0"
      ).get(userId);
      io.to(userData.socketId).emit('notification-count', { unread_count: unreadRow.count });
    } catch (e) {
      console.error('Error emitting notification count:', e);
    }
  }
}

module.exports = { app, server, io, emitNotification };
