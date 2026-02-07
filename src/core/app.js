const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('../database/mongo');
const logger = require('./logger');
const db = require('../database/db'); // SQLite (Keep for legacy/existing features if needed)

// Initialize App
const app = express();

// Connect to MongoDB
connectDB();

// Trust Proxy (Required for Railway/Heroku behind load balancer)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://cdn.discordapp.com", "https://dummyimage.com"]
        }
    }
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Standard Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(require('../web/middleware/i18nMiddleware'));

// Session Configuration Moved Up
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Logging Middleware & Session Monitor
app.use((req, res, next) => {
    console.log(`[LOG] ${req.method} ${req.url} - Auth: ${req.isAuthenticated()} - SessionID: ${req.sessionID}`);
    next();
});

// Serve Dashboard
const dashboardPath = path.join(__dirname, '../web/dashboard/dist');
app.use('/dashboard', express.static(dashboardPath));
app.use('/dashboard', (req, res) => {
    res.sendFile(path.join(dashboardPath, 'index.html'));
});

// Routes
app.use('/', require('../web/routes/index'));
app.use('/auth', require('../web/routes/auth'));
app.use('/api', require('../web/routes/api'));


// Health Check & DB Status
app.get('/health', (req, res) => {
    try {
        const tables = [
            'users', 'tickets', 'settings', 'activity_logs',
            'custom_commands', 'levels', 'economy', 'giveaways'
        ];
        const status = {};

        tables.forEach(table => {
            try {
                const count = db.prepare(`SELECT count(*) as count FROM ${table}`).get();
                status[table] = { exists: true, count: count.count };
            } catch (e) {
                status[table] = { exists: false, error: e.message };
            }
        });

        res.json({
            status: 'ok',
            uptime: process.uptime(),
            db: status
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Error Handler
app.use((err, req, res, next) => {
    logger.error('!!! WEB ERROR !!!');
    logger.error(`Path: ${req.url}`);
    logger.error(`Error: ${err.message}`);
    logger.error(err.stack);
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
