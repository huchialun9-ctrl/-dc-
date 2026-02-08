const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { connectDB, getIsConnected } = require('../database/mongo');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('./logger');

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
        // Upsert User to MongoDB if connected
        if (getIsConnected()) {
            await User.findOneAndUpdate(
                { id: profile.id },
                {
                    username: profile.username,
                    avatar: profile.avatar,
                    guilds: profile.guilds,
                    lastLogin: new Date()
                },
                { upsert: true, new: true }
            );
            console.log(`[AUTH DEBUG] User ${profile.username} persisted to MongoDB`);
        }
        return done(null, profile);
    } catch (err) {
        console.error(`[AUTH DEBUG] Error in strategy: ${err.message}`);
        return done(null, profile); // Continue even if DB fail to not block login
    }
}));

// Logging Middleware
app.use((req, res, next) => {
    if (req.url !== '/health') {
        console.log(`[LOG] ${req.method} ${req.url} - Auth: ${req.isAuthenticated()}`);
    }
    next();
});

// Serve Dashboard (with authentication check)
const dashboardPath = path.join(__dirname, '../web/dashboard/dist');

// Check authentication BEFORE serving any dashboard files
app.use('/dashboard', (req, res, next) => {
    // Allow static assets to pass through
    if (req.path.startsWith('/assets/') || req.path.endsWith('.svg')) {
        return next();
    }

    // Check if user is authenticated
    if (!req.isAuthenticated()) {
        // Show login page
        return res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VX6 Bot - Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #faf8f3;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        h1 { color: #2d3748; font-weight: 800; margin-bottom: 0.5rem; font-size: 1.8rem; }
        p { color: #2d3748; font-weight: 600; margin-bottom: 2rem; line-height: 1.6; }
        .btn {
            background: #5865F2;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }
        .btn:hover { background: #4752C4; transform: translateY(-2px); }
        .icon-container {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .footer-links {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .footer-links a {
            color: #2d3748;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 700;
            transition: color 0.2s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .footer-links a:hover { color: #5865F2; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="icon-container">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
        </div>
        <h1>VX6 Bot</h1>
        <p>使用 Discord 登入以開始建立您的伺服器</p>
        <a href="/auth/discord" class="btn">
            <svg width="20" height="20" style="vertical-align: middle; margin-right: 8px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            使用 Discord 登入
        </a>
        <div class="footer-links">
            <a href="https://github.com/huchialun9-ctrl/-dc-" target="_blank" rel="noopener">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
            </a>
            <a href="https://github.com/huchialun9-ctrl/-dc-#readme" target="_blank" rel="noopener">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                使用文檔
            </a>
        </div>
    </div>
</body>
</html>
        `);
    }
    next();
});

app.use('/dashboard', express.static(dashboardPath));
app.use('/dashboard', (req, res) => {
    res.sendFile(path.join(dashboardPath, 'index.html'));
});

// Routes
app.use('/', require('../web/routes/index'));
app.use('/auth', require('../web/routes/auth'));
app.use('/api', require('../web/routes/api'));


// Health Check & Status
app.get('/health', async (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        database: getIsConnected() ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
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
