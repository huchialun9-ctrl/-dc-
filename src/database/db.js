const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../core/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: (msg) => logger.debug(msg) });

// Enable Write-Ahead Logging for concurrency
db.pragma('journal_mode = WAL');

module.exports = db;
