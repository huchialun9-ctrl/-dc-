const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./logger');
const db = require('../database/db');

// Initialize App
const app = express();

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
app.use(express.static(path.join(__dirname, '../web/public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
}));

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
        // Upsert User to Database
        const stmt = db.prepare(`
            INSERT INTO users (id, username, avatar, last_login) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET 
            username = excluded.username, 
            avatar = excluded.avatar, 
            last_login = CURRENT_TIMESTAMP
        `);
        stmt.run(profile.id, profile.username, profile.avatar);

        // Log Activity
        const logStmt = db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)');
        logStmt.run(profile.id, 'LOGIN', `Logged in via Discord`);

        return done(null, profile);
    } catch (err) {
        logger.error(`Auth Error: ${err.message}`);
        return done(err, null);
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../web/views'));

// Logging Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

// Routes
app.use('/', require('../web/routes/index'));
app.use('/auth', require('../web/routes/auth'));
app.use('/dashboard', require('../web/routes/dashboard')); // Protected

// Error Handler
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).render('error', { error: 'Internal Server Error' });
});

module.exports = app;
