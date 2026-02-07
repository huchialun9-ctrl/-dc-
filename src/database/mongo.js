const mongoose = require('mongoose');
const logger = require('../core/logger');

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        logger.warn('⚠️ MONGODB_URI is missing. Database features will be unavailable.');
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    }
};

module.exports = connectDB;
