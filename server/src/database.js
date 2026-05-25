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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      game_type TEXT DEFAULT 'obby',
      thumbnail_color TEXT DEFAULT '#0066ff',
      thumbnail_emoji TEXT DEFAULT '🎮'
    )
  `);

  // Add new columns to existing games table if they don't exist yet
  try { db.exec(`ALTER TABLE games ADD COLUMN game_type TEXT DEFAULT 'obby'`); } catch (_) {}
  try { db.exec(`ALTER TABLE games ADD COLUMN thumbnail_color TEXT DEFAULT '#0066ff'`); } catch (_) {}
  try { db.exec(`ALTER TABLE games ADD COLUMN thumbnail_emoji TEXT DEFAULT '🎮'`); } catch (_) {}


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

  // Gamepasses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gamepasses (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      icon TEXT DEFAULT '⭐',
      benefits TEXT,
      created_at TEXT
    )
  `);

  // Store items table (avatar accessories/clothes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      icon TEXT,
      rarity TEXT DEFAULT 'common',
      created_at TEXT
    )
  `);

  // Purchases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      price_paid INTEGER NOT NULL,
      purchased_at TEXT
    )
  `);

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      data TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT
    )
  `);

  seedGames(db);
  seedGamepasses(db);
  seedStoreItems(db);

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

function seedGamepasses(db) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM gamepasses').get();
  if (existing.count > 0) return;

  const now = new Date().toISOString();
  const gamepasses = [
    // Adventure
    { id: uuidv4(), game_id: 'adventure', title: 'Speed Boost', description: 'Move 50% faster than other players.', price: 50, icon: '⚡', benefits: 'Speed +50%', created_at: now },
    { id: uuidv4(), game_id: 'adventure', title: 'Double Jump', description: 'Jump twice in mid-air to reach new heights.', price: 75, icon: '🦘', benefits: 'Extra jump', created_at: now },
    { id: uuidv4(), game_id: 'adventure', title: 'VIP Access', description: 'Unlock VIP-only areas and exclusive quests.', price: 150, icon: '👑', benefits: 'VIP areas, exclusive quests', created_at: now },

    // Obby
    { id: uuidv4(), game_id: 'obby', title: 'Checkpoint Saver', description: 'Save your checkpoint and return anytime.', price: 30, icon: '💾', benefits: 'Persistent checkpoints', created_at: now },
    { id: uuidv4(), game_id: 'obby', title: 'Slow Fall', description: 'Descend slowly and never miss a platform.', price: 60, icon: '🪂', benefits: 'Reduced fall speed', created_at: now },
    { id: uuidv4(), game_id: 'obby', title: 'Noclip Pass', description: 'Phase through walls for 10 seconds (3 uses).', price: 200, icon: '👻', benefits: 'Limited noclip ability', created_at: now },

    // Roleplay
    { id: uuidv4(), game_id: 'roleplay', title: 'Extra Character Slot', description: 'Create an additional character for roleplay.', price: 100, icon: '🎭', benefits: '+1 character slot', created_at: now },
    { id: uuidv4(), game_id: 'roleplay', title: 'Premium Emotes', description: 'Unlock 20+ exclusive premium emote animations.', price: 80, icon: '💃', benefits: '20+ premium emotes', created_at: now },
    { id: uuidv4(), game_id: 'roleplay', title: 'VIP Access', description: 'Unlock VIP lounge and premium storylines.', price: 150, icon: '🌟', benefits: 'VIP lounge, premium storylines', created_at: now },

    // Fighting
    { id: uuidv4(), game_id: 'fighting', title: 'Exclusive Weapon', description: 'Wield a legendary weapon unavailable to others.', price: 120, icon: '⚔️', benefits: 'Legendary weapon skin', created_at: now },
    { id: uuidv4(), game_id: 'fighting', title: '2x XP Boost', description: 'Earn double XP on every match.', price: 90, icon: '📈', benefits: 'XP x2', created_at: now },
    { id: uuidv4(), game_id: 'fighting', title: 'Tournament Entry', description: 'Enter exclusive ranked tournaments.', price: 175, icon: '🏆', benefits: 'Ranked tournament access', created_at: now },

    // Simulator
    { id: uuidv4(), game_id: 'simulator', title: 'Auto Collect', description: 'Automatically collect resources without clicking.', price: 70, icon: '🤖', benefits: 'Auto-collect resources', created_at: now },
    { id: uuidv4(), game_id: 'simulator', title: '10x Money', description: 'Earn 10 times the in-game money from every action.', price: 200, icon: '💰', benefits: 'Money x10', created_at: now },
    { id: uuidv4(), game_id: 'simulator', title: 'Rebirth Bonus', description: 'Gain extra rewards on each rebirth.', price: 130, icon: '🔄', benefits: 'Rebirth multiplier', created_at: now },

    // Racing
    { id: uuidv4(), game_id: 'racing', title: 'Turbo Boost', description: 'Activate a powerful turbo that doubles your speed.', price: 85, icon: '🚀', benefits: 'Turbo ability unlocked', created_at: now },
    { id: uuidv4(), game_id: 'racing', title: 'Nitro Pack', description: 'Get 5 extra nitro charges per race.', price: 110, icon: '⛽', benefits: '+5 nitro per race', created_at: now },
    { id: uuidv4(), game_id: 'racing', title: 'Exclusive Car Skin', description: 'Unlock a legendary car skin no one else has.', price: 160, icon: '🏎️', benefits: 'Legendary car skin', created_at: now },

    // Generic (all games)
    { id: uuidv4(), game_id: 'all', title: 'Premium Membership', description: 'Monthly premium perks across all Plor games.', price: 500, icon: '💎', benefits: 'Premium badge, 2x daily rewards, exclusive chat color', created_at: now },
    { id: uuidv4(), game_id: 'all', title: 'Name Color', description: 'Display your username in a custom color.', price: 300, icon: '🎨', benefits: 'Custom username color', created_at: now },
    { id: uuidv4(), game_id: 'all', title: 'Profile Badge', description: 'Show off a prestigious badge on your profile.', price: 250, icon: '🏅', benefits: 'Exclusive profile badge', created_at: now },
  ];

  const insert = db.prepare(`
    INSERT INTO gamepasses (id, game_id, title, description, price, icon, benefits, created_at)
    VALUES (@id, @game_id, @title, @description, @price, @icon, @benefits, @created_at)
  `);
  const insertMany = db.transaction((items) => { for (const item of items) insert.run(item); });
  insertMany(gamepasses);
  console.log(`Seeded ${gamepasses.length} gamepasses into database`);
}

function seedStoreItems(db) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM store_items').get();
  if (existing.count > 0) return;

  const now = new Date().toISOString();
  const items = [
    // Hats
    { id: uuidv4(), name: 'Domino Crown', description: 'The most iconic hat on the platform — a true status symbol.', category: 'hat', price: 1000, icon: '👑', rarity: 'rare', created_at: now },
    { id: uuidv4(), name: 'Sparkle Time Fedora', description: 'A shimmering fedora that sparkles with every step.', category: 'hat', price: 800, icon: '🎩', rarity: 'rare', created_at: now },
    { id: uuidv4(), name: 'Pal Hair', description: 'A friendly, casual hairstyle for everyday adventures.', category: 'hat', price: 50, icon: '💇', rarity: 'common', created_at: now },

    // Faces
    { id: uuidv4(), name: 'Smile', description: 'A classic happy smile face.', category: 'face', price: 20, icon: '😊', rarity: 'common', created_at: now },
    { id: uuidv4(), name: 'Chill Face', description: 'Stay cool with this relaxed, laid-back expression.', category: 'face', price: 150, icon: '😎', rarity: 'uncommon', created_at: now },
    { id: uuidv4(), name: 'Shocked', description: 'Express total surprise with wide eyes and an open mouth.', category: 'face', price: 30, icon: '😮', rarity: 'common', created_at: now },

    // Accessories
    { id: uuidv4(), name: 'Sword of the Blox Knight', description: 'A legendary blade carried by the mightiest knights.', category: 'accessory', price: 500, icon: '⚔️', rarity: 'rare', created_at: now },
    { id: uuidv4(), name: 'Wings', description: 'Majestic wings that make you look like an angel.', category: 'accessory', price: 2000, icon: '🪽', rarity: 'epic', created_at: now },
    { id: uuidv4(), name: 'Magic Wand', description: 'Cast imaginary spells with this glowing wand.', category: 'accessory', price: 120, icon: '🪄', rarity: 'uncommon', created_at: now },

    // Clothes
    { id: uuidv4(), name: 'Classic Shirt', description: 'A simple, clean shirt for any occasion.', category: 'clothing', price: 10, icon: '👕', rarity: 'common', created_at: now },
    { id: uuidv4(), name: 'Striped Tee', description: 'A trendy striped T-shirt with a retro vibe.', category: 'clothing', price: 15, icon: '👔', rarity: 'common', created_at: now },
    { id: uuidv4(), name: 'Leather Jacket', description: 'Look tough and stylish with this sleek leather jacket.', category: 'clothing', price: 80, icon: '🧥', rarity: 'uncommon', created_at: now },
    { id: uuidv4(), name: 'Space Suit', description: 'Gear up for intergalactic adventures.', category: 'clothing', price: 350, icon: '🚀', rarity: 'rare', created_at: now },

    // Bundles
    { id: uuidv4(), name: 'Robux Starter Pack', description: 'Kickstart your Plor journey with 500 bonus Robux virtual currency.', category: 'bundle', price: 200, icon: '💸', rarity: 'common', created_at: now },
    { id: uuidv4(), name: 'Adventure Bundle', description: 'Everything you need to start adventuring — hat, face, and outfit included.', category: 'bundle', price: 300, icon: '🎒', rarity: 'uncommon', created_at: now },
  ];

  const insert = db.prepare(`
    INSERT INTO store_items (id, name, description, category, price, icon, rarity, created_at)
    VALUES (@id, @name, @description, @category, @price, @icon, @rarity, @created_at)
  `);
  const insertMany = db.transaction((items) => { for (const item of items) insert.run(item); });
  insertMany(items);
  console.log(`Seeded ${items.length} store items into database`);
}

module.exports = { getDb, initializeDatabase };
