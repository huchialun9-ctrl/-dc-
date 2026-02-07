const express = require('express');
const router = express.Router();
const aiService = require('../../bot/services/aiService');
const executionService = require('../../bot/services/executionService');
const GuildConfig = require('../../models/GuildConfig');
const mongo = require('../../database/mongo');
const client = require('../../bot/client');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Unauthorized' });
};

// Get guilds where user has Manage Server permission and bot is present
router.get('/guilds', isAuthenticated, async (req, res) => {
    try {
        const userGuilds = req.user.guilds || [];
        console.log(`[DEBUG] User ${req.user.username} has ${userGuilds.length} guilds in session`);

        // Lenient filter: Any guild where they have Manage Server or Administrator
        const manageableGuilds = userGuilds.filter(g => {
            const perms = BigInt(g.permissions);
            const MANAGE_GUILD = 1n << 5n;
            const ADMINISTRATOR = 1n << 3n;
            return (perms & MANAGE_GUILD) === MANAGE_GUILD || (perms & ADMINISTRATOR) === ADMINISTRATOR;
        });

        const guildsWithBot = manageableGuilds.map(g => {
            const guild = client.guilds.cache.get(g.id);
            return {
                id: g.id,
                name: g.name,
                icon: g.icon,
                botPresent: !!guild,
                iconUrl: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null
            };
        });

        res.json(guildsWithBot);
    } catch (error) {
        console.error('[API ERROR] /guilds:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug: Get current user profile
router.get('/user', isAuthenticated, (req, res) => {
    res.json({
        auth: req.isAuthenticated(),
        user: req.user
    });
});

// Public Session Check (No Auth Required)
router.get('/session-check', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        authenticated: req.isAuthenticated(),
        userPresent: !!req.user,
        guildsCount: req.user?.guilds?.length || 0,
        cookies: req.cookies
    });
});

// Generate structure from AI
router.get('/generate-structure', isAuthenticated, async (req, res) => {
    const { description, guildId } = req.query;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    console.log('[AI Generation Request]', { description, guildId, dbConnected: mongo.getIsConnected() });

    try {
        let settings = {};

        // Only query GuildSettings if database is connected
        if (guildId && mongo.getIsConnected()) {
            try {
                const GuildSettings = require('../../models/GuildSettings');
                settings = await GuildSettings.findOne({ guildId }) || {};
                console.log('[AI Settings] Loaded from database', { language: settings.language, template: settings.template });
            } catch (dbError) {
                console.warn('[AI Settings] Database query failed, using defaults', { error: dbError.message });
            }
        } else {
            console.log('[AI Settings] Using defaults (DB not connected or no guildId)');
        }

        const structure = await aiService.parseServerStructure(description, {
            language: settings.language,
            template: settings.template
        });

        console.log('[AI Response]', { hasError: !!structure.error, structure });

        res.json(structure);
    } catch (error) {
        console.error('[AI Generation Error - Catch Block]', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ error: error.message });
    }
});

// Execute build
router.post('/execute-build', isAuthenticated, async (req, res) => {
    const { guildId, structure } = req.body;
    if (!guildId || !structure) return res.status(400).json({ error: 'GuildID and Structure are required' });

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: 'Bot is not in this guild' });

        // Run execution (async)
        executionService.executeBuild(guild, structure).then(async (result) => {
            if (result.success && mongo.getIsConnected()) {
                try {
                    // Update implementation status if DB is available
                    const GuildConfig = require('../../models/GuildConfig');
                    const config = await GuildConfig.findOne({ guildId });
                    if (config) {
                        const latest = config.structures[config.structures.length - 1];
                        if (latest) {
                            latest.implemented = true;
                            await config.save();
                        }
                    }
                } catch (e) {
                    console.error('Failed to update build status in DB:', e);
                }
            }
        });

        res.json({ message: 'Build started in background', success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get/Update Guild Settings (Language, Template)
router.get('/settings/:guildId', isAuthenticated, async (req, res) => {
    const { guildId } = req.params;

    // Return defaults if database is not connected
    if (!mongo.getIsConnected()) {
        return res.json({ guildId, language: 'Traditional Chinese', template: '' });
    }

    try {
        const GuildSettings = require('../../models/GuildSettings');
        let settings = await GuildSettings.findOne({ guildId });
        if (!settings) {
            settings = await GuildSettings.create({ guildId });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/:guildId', isAuthenticated, async (req, res) => {
    const { guildId } = req.params;
    const { language, template } = req.body;

    // Return success with current values if database is not connected
    if (!mongo.getIsConnected()) {
        console.warn('[Settings] Cannot save to database - DB not connected');
        return res.json({ guildId, language, template, warning: 'Settings not persisted (database unavailable)' });
    }

    try {
        const GuildSettings = require('../../models/GuildSettings');
        const update = {};
        if (language) update.language = language;
        if (template !== undefined) update.template = template;

        const settings = await GuildSettings.findOneAndUpdate(
            { guildId },
            update,
            { upsert: true, new: true }
        );
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check bot status and permissions in a guild
router.get('/guild-status/:guildId', isAuthenticated, async (req, res) => {
    const { guildId } = req.params;
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.json({ botPresent: false });

        const botMember = await guild.members.fetchMe();
        const hasAdmin = botMember.permissions.has('Administrator');

        res.json({
            botPresent: true,
            hasAdmin,
            memberCount: guild.memberCount,
            name: guild.name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
