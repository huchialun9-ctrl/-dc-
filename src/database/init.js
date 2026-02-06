const db = require('./db');
const fs = require('fs');
const path = require('path');
const logger = require('../core/logger');

function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema);

        // Migrations
        // Migrations: Safer Check
        try {
            const columns = db.pragma('table_info(settings)').map(c => c.name);
            if (!columns.includes('ai_chat_enabled')) {
                db.exec("ALTER TABLE settings ADD COLUMN ai_chat_enabled INTEGER DEFAULT 0");
                logger.info('✅ Migrated DB: Added ai_chat_enabled column');
            }
        } catch (e) {
            logger.warn('Migration warning: ' + e.message);
        }

        logger.info('Database initialized successfully.');
    } catch (error) {
        logger.error('Failed to initialize database: ' + error.message);
        process.exit(1);
    }
}

module.exports = initDb;
