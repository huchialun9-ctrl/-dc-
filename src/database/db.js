const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../core/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: (msg) => logger.debug(msg) });

// Enable Write-Ahead Logging for concurrency
db.pragma('journal_mode = WAL');

// --- Table Initialization ---
const initTable = (name, sql) => {
    try {
        db.prepare(sql).run();
        logger.info(`✅ Database table initialized: ${name}`);
    } catch (err) {
        logger.error(`❌ Failed to initialize table ${name}: ${err.message}`);
        // If it's a critical table and it fails, we might want to know why
        if (!err.message.includes('already exists')) {
            console.error(err);
        }
    }
};

initTable("Users", "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, avatar TEXT, guilds TEXT, last_login DATETIME)");
initTable("Tickets", "CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, channel_id TEXT, guild_id TEXT, status TEXT DEFAULT 'open', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
initTable("Settings", `CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT PRIMARY KEY,
    welcome_enabled INTEGER DEFAULT 0,
    welcome_channel_id TEXT,
    welcome_message TEXT,
    automod_badwords TEXT DEFAULT '',
    automod_links INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
initTable("Activity Logs", "CREATE TABLE IF NOT EXISTS activity_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT, details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
initTable("Custom Commands", `CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
initTable("Levels", "CREATE TABLE IF NOT EXISTS levels (user_id TEXT, guild_id TEXT, xp INTEGER DEFAULT 0, level INTEGER DEFAULT 0, last_xp_time DATETIME, PRIMARY KEY (user_id, guild_id))");
initTable("Transcripts", "CREATE TABLE IF NOT EXISTS ticket_transcripts (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_name TEXT, guild_id TEXT, user_id TEXT, html_content TEXT, closed_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
initTable("Economy", `CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT, 
    guild_id TEXT, 
    balance INTEGER DEFAULT 0, 
    last_daily DATETIME, 
    PRIMARY KEY (user_id, guild_id)
)`);
initTable("Giveaways", `CREATE TABLE IF NOT EXISTS giveaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    prize TEXT NOT NULL,
    winners_count INTEGER DEFAULT 1,
    end_time INTEGER NOT NULL,
    hosted_by TEXT NOT NULL,
    ended INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
initTable("Voice Master", `CREATE TABLE IF NOT EXISTS voice_master (
    guild_id TEXT PRIMARY KEY,
    category_id TEXT,
    channel_id TEXT NOT NULL
)`);
initTable("Voice Channels", `CREATE TABLE IF NOT EXISTS voice_channels (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    is_locked INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
initTable("Earthquake Subs", `CREATE TABLE IF NOT EXISTS earthquake_subs (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    min_intensity INTEGER DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// --- Migrations ---
const safeAlter = (stmt) => {
    try {
        db.prepare(stmt).run();
        logger.debug(`Migration successful: ${stmt}`);
    } catch (e) {
        /* Ignore if column exists */
        if (e.message.includes('duplicate column name')) return;
        logger.warn(`Migration skipped/failed: ${e.message} (${stmt})`);
    }
};

logger.info('Running database migrations...');

// Core Settings Expansion
safeAlter("ALTER TABLE settings ADD COLUMN log_channel_id TEXT");
safeAlter("ALTER TABLE settings ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
safeAlter("ALTER TABLE settings ADD COLUMN automod_badwords TEXT DEFAULT ''");
safeAlter("ALTER TABLE settings ADD COLUMN automod_links INTEGER DEFAULT 0");
safeAlter("ALTER TABLE settings ADD COLUMN ticket_categories TEXT");
safeAlter("ALTER TABLE settings ADD COLUMN leveling_enabled INTEGER DEFAULT 0");
safeAlter("ALTER TABLE settings ADD COLUMN economy_enabled INTEGER DEFAULT 0");
safeAlter("ALTER TABLE settings ADD COLUMN ai_chat_enabled INTEGER DEFAULT 1");
safeAlter("ALTER TABLE settings ADD COLUMN ai_channel_id TEXT");
safeAlter("ALTER TABLE settings ADD COLUMN economy_daily INTEGER DEFAULT 100");
safeAlter("ALTER TABLE settings ADD COLUMN economy_start_balance INTEGER DEFAULT 0");
safeAlter("ALTER TABLE settings ADD COLUMN music_volume INTEGER DEFAULT 50");
safeAlter("ALTER TABLE settings ADD COLUMN leveling_rate REAL DEFAULT 1.0");
safeAlter("ALTER TABLE settings ADD COLUMN announcement_enabled INTEGER DEFAULT 0");
safeAlter("ALTER TABLE settings ADD COLUMN music_enabled INTEGER DEFAULT 0");
safeAlter("ALTER TABLE settings ADD COLUMN custom_commands_enabled INTEGER DEFAULT 0");
safeAlter("ALTER TABLE settings ADD COLUMN automod_enabled INTEGER DEFAULT 0");

// Activity Logs Expansion
safeAlter("ALTER TABLE activity_logs ADD COLUMN ip_address TEXT");

module.exports = db;
