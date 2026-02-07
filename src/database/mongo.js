const mongoose = require('mongoose');
const logger = require('../core/logger');

let isConnected = false;

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        logger.warn('⚠️ MONGODB_URI is missing. Database features will be unavailable.');
        return;
    }

    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
        logger.warn('🚨 MONGODB_URI points to localhost. If this is a cloud deployment (Railway), it will fail to connect.');
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // 5 seconds instead of 30
            autoIndex: true, // Auto-create indexes
            bufferCommands: false // Fail fast if not connected
        });
        isConnected = true;
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`❌ MongoDB Connection Error (${uri}): ${error.message}`);
    }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
