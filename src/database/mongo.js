const mongoose = require('mongoose');
const logger = require('../core/logger');

let isConnected = false;

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        logger.warn('⚠️ MONGODB_URI is missing. Database features will be unavailable.');
        return false;
    }

    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
        logger.warn('🚨 MONGODB_URI points to localhost. If this is a cloud deployment (Railway), it will fail to connect.');
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true,
            bufferCommands: false
        });
        isConnected = true;
        logger.info(`✅ MongoDB Connected successfully`);
        return true;
    } catch (error) {
        logger.error(`❌ MongoDB Connection Failed: ${error.message}`);
        return false;
    }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
