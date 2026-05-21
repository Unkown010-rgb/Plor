const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'plor.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const db = getDb();

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT,
      robux INTEGER NOT NULL DEFAULT 100,
      avatar_data TEXT DEFAULT '{}',
      description TEXT DEFAULT ''
    )
  `);

  // Games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      thumbnail TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      players_online INTEGER NOT NULL DEFAULT 0,
      max_players INTEGER NOT NULL DEFAULT 50,
      created_by TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      plays INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Friendships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    )
  `);

  // Game sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  seedGames(db);

  console.log('Database initialized successfully');
  return db;
}

function seedGames(db) {
  const existingGames = db.prepare('SELECT COUNT(*) as count FROM games').get();
  if (existingGames.count > 0) return;

  const systemUserId = 'system-' + uuidv4();

  // Insert a system user for seeded games
  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name)
    VALUES (?, 'plor_system', 'system@plor.gg', 'not-a-real-hash', 'Plor System')
  `).run(systemUserId);

  const games = [
    // Adventure
    {
      id: uuidv4(),
      title: 'Dragon Quest Adventures',
      description: 'Embark on an epic journey through mystical lands filled with dragons, dungeons, and legendary treasures.',
      thumbnail: 'https://picsum.photos/seed/dragon/400/225',
      category: 'Adventure',
      players_online: 1243,
      max_players: 100,
      rating: 4.8,
      plays: 15200000,
    },
    {
      id: uuidv4(),
      title: 'Lost Islands Explorer',
      description: 'Navigate treacherous seas and discover uncharted islands packed with mysteries and hidden civilizations.',
      thumbnail: 'https://picsum.photos/seed/islands/400/225',
      category: 'Adventure',
      players_online: 876,
      max_players: 75,
      rating: 4.6,
      plays: 8900000,
    },

    // Obby
    {
      id: uuidv4(),
      title: 'Sky Tower Obby',
      description: 'Conquer the ultimate obstacle course that spirals 1000 stages into the sky. Can you reach the top?',
      thumbnail: 'https://picsum.photos/seed/skytower/400/225',
      category: 'Obby',
      players_online: 3421,
      max_players: 200,
      rating: 4.9,
      plays: 45000000,
    },
    {
      id: uuidv4(),
      title: 'Lava Escape Obby',
      description: 'The volcano is erupting! Race through collapsing platforms and avoid the rising lava to survive.',
      thumbnail: 'https://picsum.photos/seed/lava/400/225',
      category: 'Obby',
      players_online: 2109,
      max_players: 150,
      rating: 4.7,
      plays: 32000000,
    },

    // Roleplay
    {
      id: uuidv4(),
      title: 'City Life Roleplay',
      description: 'Live your best virtual life in a sprawling city. Get a job, buy a house, drive cars, and socialize.',
      thumbnail: 'https://picsum.photos/seed/citylife/400/225',
      category: 'Roleplay',
      players_online: 5678,
      max_players: 300,
      rating: 4.5,
      plays: 89000000,
    },
    {
      id: uuidv4(),
      title: 'Fantasy Kingdom RP',
      description: 'Rule as royalty, serve as a knight, or live as a peasant in this immersive medieval fantasy world.',
      thumbnail: 'https://picsum.photos/seed/kingdom/400/225',
      category: 'Roleplay',
      players_online: 2340,
      max_players: 200,
      rating: 4.4,
      plays: 21000000,
    },

    // Fighting
    {
      id: uuidv4(),
      title: 'Ninja Showdown',
      description: 'Master ancient martial arts and battle other ninja warriors in fast-paced 1v1 and team combat.',
      thumbnail: 'https://picsum.photos/seed/ninja/400/225',
      category: 'Fighting',
      players_online: 1987,
      max_players: 50,
      rating: 4.7,
      plays: 18500000,
    },
    {
      id: uuidv4(),
      title: 'Street Brawlers Arena',
      description: 'Choose your fighter and compete in brutal street fighting tournaments across iconic global arenas.',
      thumbnail: 'https://picsum.photos/seed/brawlers/400/225',
      category: 'Fighting',
      players_online: 1456,
      max_players: 60,
      rating: 4.3,
      plays: 12000000,
    },

    // Simulator
    {
      id: uuidv4(),
      title: 'Mining Tycoon Simulator',
      description: 'Dig deep, collect rare ores, upgrade your tools, and build a mining empire from scratch.',
      thumbnail: 'https://picsum.photos/seed/mining/400/225',
      category: 'Simulator',
      players_online: 4321,
      max_players: 100,
      rating: 4.6,
      plays: 67000000,
    },
    {
      id: uuidv4(),
      title: 'Pet Ranch Simulator',
      description: 'Hatch and collect adorable pets, train them to be the strongest, and trade with other ranchers.',
      thumbnail: 'https://picsum.photos/seed/petranch/400/225',
      category: 'Simulator',
      players_online: 6789,
      max_players: 150,
      rating: 4.8,
      plays: 120000000,
    },

    // Racing
    {
      id: uuidv4(),
      title: 'Turbo Speed Racing',
      description: 'Race exotic supercars on stunning tracks around the world. Upgrade your ride and dominate the leaderboards.',
      thumbnail: 'https://picsum.photos/seed/turbospeed/400/225',
      category: 'Racing',
      players_online: 2567,
      max_players: 20,
      rating: 4.5,
      plays: 34000000,
    },
    {
      id: uuidv4(),
      title: 'Off-Road Madness',
      description: 'Tear through muddy trails, rocky mountains, and jungle paths in the wildest off-road racing game.',
      thumbnail: 'https://picsum.photos/seed/offroad/400/225',
      category: 'Racing',
      players_online: 1123,
      max_players: 16,
      rating: 4.2,
      plays: 9800000,
    },
  ];

  const insertGame = db.prepare(`
    INSERT INTO games (id, title, description, thumbnail, category, players_online, max_players, created_by, rating, plays)
    VALUES (@id, @title, @description, @thumbnail, @category, @players_online, @max_players, @created_by, @rating, @plays)
  `);

  const insertMany = db.transaction((games) => {
    for (const game of games) {
      insertGame.run({ ...game, created_by: systemUserId });
    }
  });

  insertMany(games);
  console.log(`Seeded ${games.length} games into database`);
}

module.exports = { getDb, initializeDatabase };
