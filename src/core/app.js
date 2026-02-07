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

// Serve Dashboard
const dashboardPath = path.join(__dirname, '../web/dashboard/dist');
app.use('/dashboard', express.static(dashboardPath));
app.get('/dashboard/*', (req, res) => {
    res.sendFile(path.join(dashboardPath, 'index.html'));
});

// Session
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    name: 'vx6.sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
};

if (process.env.NODE_ENV === 'production') {
    logger.info('Production mode detected. Secure cookies enabled.');
}

app.use(session(sessionConfig));

// Passport Config
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        logger.info(`Auth Attempt: ${profile.id} (${profile.username})`);

        // Upsert User to Database (SQLite for user session/metadata)
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
        logger.error(`Auth Callback Error: ${err.message}`);
        return done(err, null);
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Logging Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
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
