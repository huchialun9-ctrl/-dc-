const db = require('./db');
const fs = require('fs');
const path = require('path');
const logger = require('../core/logger');

function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema);
        logger.info('Database initialized successfully.');
    } catch (error) {
        logger.error('Failed to initialize database: ' + error.message);
        process.exit(1);
    }
}

module.exports = initDb;
