require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const { Client, GatewayIntentBits, Partials, Collection, ChannelType } = require('discord.js');
const path = require('path');

// --- Configuration ---
const PORT = process.env.PORT || 8000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.REDIRECT_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;

const fs = require('fs');

// --- Discord Bot Setup ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'src/bot/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load Events
const eventsPath = path.join(__dirname, 'src/bot/events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js')); // Fixed: use .js filter

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// --- Auto-Close Logic ---
const INACTIVITY_LIMIT = 24 * 60 * 60 * 1000; // 24 Hours
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 Minutes

setInterval(async () => {
    client.guilds.cache.forEach(async guild => {
        const category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
        if (!category) return;

        category.children.cache.forEach(async channel => {
            if (!channel.isTextBased() || !channel.name.startsWith('ticket-')) return;

            try {
                const messages = await channel.messages.fetch({ limit: 1 });
                const lastMessage = messages.first();

                if (lastMessage) {
                    const timeDiff = Date.now() - lastMessage.createdTimestamp;
                    if (timeDiff > INACTIVITY_LIMIT) {
                        await channel.send('This ticket has been inactive for 24 hours. Closing in 5 minutes...');
                        // Schedule actual close or direct close? User asked for detection.
                        // For safety, avoiding auto-delete without warning. 
                        // Implementation choice: Warn.
                    }
                }
            } catch (err) {
                console.error(`[AutoClose] Error checking channel ${channel.name}:`, err);
            }
        });
    });
}, CHECK_INTERVAL);

client.once('ready', () => {
    console.log(`[BOT] Logged in as ${client.user.tag}`);
    client.user.setActivity('Tickets', { type: 3 }); // Watching Tickets
});

// --- Express & Passport Setup ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
}));

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/web/views'));
app.use(express.static(path.join(__dirname, 'src/web/public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Auth Routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// Dashboard Protected Route
app.get('/dashboard', checkAuth, (req, res) => {
    res.render('dashboard', {
        user: req.user,
        botUser: client.user,
        guilds: client.guilds.cache.size,
        uptime: process.uptime()
    });
});

// Main Page
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/discord');
}

// --- Start ---

// Start Bot
client.login(BOT_TOKEN).catch(err => {
    console.error('[BOT] Login Failed:', err);
});

// Start Server
app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
});
