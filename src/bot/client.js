const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../core/logger');

const GiveawayService = require('./services/giveawayService');
const EarthquakeService = require('./services/earthquakeService');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates // Required for Music
    ]
});

const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const config = {
    ffmpeg: {
        path: require('ffmpeg-static') // Explicitly set FFmpeg path
    },
    plugins: [
        new YtDlpPlugin({
            update: false // Write access denied on Railway
        })
    ]
};

// Try to load cookies
const cookiesPath = path.join(__dirname, '../../cookies.json');
if (fs.existsSync(cookiesPath)) {
    try {
        const rawCookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        if (Array.isArray(rawCookies)) {
            config.cookies = rawCookies;
            logger.info('✅ Loaded YouTube cookies.json');
        } else {
            logger.error('❌ cookies.json is not an array (Invalid Format)');
        }
    } catch (e) {
        logger.error('❌ Failed to parse cookies.json: ' + e.message);
    }
} else {
    logger.warn('⚠️ cookies.json not found! YouTube playback may be restricted.');
}

client.distube = new DisTube(client, config);

client.commands = new Collection();
client.giveawayService = new GiveawayService(client);
client.earthquakeService = new EarthquakeService(client);

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    // Skip distubeEvents.js as it's not a standard Discord event and manually loaded
    if (file === 'distubeEvents.js') continue;

    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Load DisTube Events
try {
    require('./events/distubeEvents')(client);
} catch (e) {
    console.error('Failed to load DisTube events:', e);
}

module.exports = client;
