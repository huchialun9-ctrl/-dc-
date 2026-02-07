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
app.use('/dashboard', express.static(dashboardPath));
app.use('/dashboard', (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
        // Show login page instead of dashboard
        return res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Discord Server Architect - Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        h1 { color: #333; margin-bottom: 0.5rem; font-size: 1.8rem; }
        p { color: #666; margin-bottom: 2rem; }
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
        .icon { font-size: 4rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="icon">🤖</div>
        <h1>AI Discord Server Architect</h1>
        <p>使用 Discord 登入以開始建立您的伺服器</p>
        <a href="/auth/discord" class="btn">
            <svg width="20" height="20" style="vertical-align: middle; margin-right: 8px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            使用 Discord 登入
        </a>
    </div>
</body>
</html>
        `);
    }
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
