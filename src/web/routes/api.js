const express = require('express');
const router = express.Router();
const aiService = require('../../bot/services/aiService');
const executionService = require('../../bot/services/executionService');
const GuildConfig = require('../../models/GuildConfig');
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
    res.json(req.user);
});

// Generate structure from AI
router.get('/generate-structure', isAuthenticated, async (req, res) => {
    const { description } = req.query;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    try {
        const structure = await aiService.parseServerStructure(description);
        res.json(structure);
    } catch (error) {
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

        // Save to DB first
        let config = await GuildConfig.findOne({ guildId });
        if (!config) {
            config = new GuildConfig({ guildId, guildName: guild.name, ownerId: guild.ownerId });
        }

        config.structures.push({
            description: req.body.description || 'API Triggered',
            jsonStructure: structure,
            implemented: false
        });
        await config.save();

        // Run execution (async)
        executionService.executeBuild(guild, structure).then(async (result) => {
            if (result.success) {
                // Update implementation status
                const latest = config.structures[config.structures.length - 1];
                latest.implemented = true;
                await config.save();
            }
        });

        res.json({ message: 'Build started in background', success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
