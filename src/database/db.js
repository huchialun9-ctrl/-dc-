const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../core/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: (msg) => logger.debug(msg) });

// Enable Write-Ahead Logging for concurrency
db.pragma('journal_mode = WAL');

// 1. Users Table
db.prepare("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, avatar TEXT, guilds TEXT, last_login DATETIME)").run();

// 2. Tickets Table
db.prepare("CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, channel_id TEXT, guild_id TEXT, status TEXT DEFAULT 'open', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();

// 3. Settings Table
db.prepare(`CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT PRIMARY KEY, 
    welcome_enabled INTEGER DEFAULT 0, 
    welcome_channel_id TEXT, 
    welcome_message TEXT, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

// 4. Activity Logs
db.prepare("CREATE TABLE IF NOT EXISTS activity_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT, details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();

// 5. Custom Commands
db.prepare(`CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

module.exports = db;
