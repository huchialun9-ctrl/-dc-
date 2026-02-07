const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { connectDB } = require('../database/mongo');
const mongoose = require('mongoose');
const logger = require('./logger');
const db = require('../database/db'); // SQLite (Keep for legacy/existing features if needed)

// Initialize App
const app = express();

// Set Mongoose Global Config
mongoose.set('bufferCommands', false);

// Connect to MongoDB (Fire and forget, but handled in mongo.js)
connectDB();

// Trust Proxy
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

// Standard Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(require('../web/middleware/i18nMiddleware'));

const MongoStore = require('connect-mongo');

// Session Configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    name: 'vx6.sid',
    proxy: true,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
};

// Robust Session Store Selection
const uri = process.env.MONGODB_URI;
const isProd = process.env.NODE_ENV === 'production';
const isLocalUri = uri && (uri.includes('localhost') || uri.includes('127.0.0.1'));

if (uri && !(isProd && isLocalUri)) {
    sessionConfig.store = MongoStore.create({
        mongoUrl: uri,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'native'
    });
    logger.info('✅ Initialized MongoStore for sessions');
} else {
    logger.warn('⚠️ Using MemoryStore for sessions (DB missing or misconfigured)');
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Passport Serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI,
    scope: ['identify', 'guilds', 'email', 'bot', 'applications.commands'],
    permissions: 8
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Upsert User to SQLite (Fallback/Metadata)
        const stmt = db.prepare(`
            INSERT INTO users (id, username, avatar, last_login) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET 
            username = excluded.username, 
            avatar = excluded.avatar, 
            last_login = CURRENT_TIMESTAMP
        `);
        stmt.run(profile.id, profile.username, profile.avatar);
        return done(null, profile);
    } catch (err) {
        return done(err, null);
    }
}));

// Logging Middleware
app.use((req, res, next) => {
    if (req.url !== '/health') {
        console.log(`[LOG] ${req.method} ${req.url} - Auth: ${req.isAuthenticated()}`);
    }
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
