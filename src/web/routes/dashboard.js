const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const db = require('../../database/db');

router.use(isAuthenticated);

router.get('/', (req, res) => {
    // Fetch stats from DB
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const ticketCount = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count;

    // Uptime from process
    const uptime = process.uptime();

    // 4. Chart Data (Last 7 Days)
    const chartLabels = [];
    const chartData = [];

    // Generate last 7 days labels
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        chartLabels.push(dateStr);
        chartData.push(0); // Init with 0
    }

    // Query DB
    const dailyStats = db.prepare(`
        SELECT date(created_at) as date, COUNT(*) as count 
        FROM tickets 
        WHERE created_at >= date('now', '-6 days')
        GROUP BY date(created_at)
    `).all();

    // Fill data
    dailyStats.forEach(stat => {
        const index = chartLabels.indexOf(stat.date);
        if (index !== -1) {
            chartData[index] = stat.count;
        }
    });

    // Format labels for display (MM/DD)
    const displayLabels = chartLabels.map(dateStr => {
        const [y, m, d] = dateStr.split('-');
        return `${m}/${d}`;
    });

    const guilds = '1 (Synced)'; // Restore missing variable

    res.render('dashboard', {
        user: req.user,
        stats: {
            users: userCount,
            tickets: ticketCount,
            uptime: uptime,
            guilds: guilds
        },
        chart: {
            labels: displayLabels,
            data: chartData
        }
    });
});

// 伺服器列表路由
router.get('/servers', (req, res) => {
    // Session 檢查：如果使用者 Session 是舊的 (沒有 guilds)，強制重新登入以獲取資料
    if (!req.user || !req.user.guilds) {
        return res.redirect('/auth/discord');
    }

    try {
        const userGuilds = req.user.guilds || [];
        const client = require('../../bot/client');

        // 過濾出管理員權限的伺服器
        const adminGuilds = userGuilds.filter(g => (g.permissions & 0x8) === 0x8 || (g.permissions & 0x20) === 0x20);

        const processedGuilds = adminGuilds.map(guild => {
            // 安全檢查：Bot Client 可能尚未準備好，使用 optional chaining
            const botInGuild = client.guilds ? client.guilds.cache.has(guild.id) : false;
            return {
                ...guild,
                hasBot: botInGuild
            };
        });

        res.render('servers', { user: req.user, guilds: processedGuilds });
    } catch (err) {
        console.error('Servers Route Error:', err);
        res.status(500).render('error', { error: '無法讀取伺服器列表，請稍後再試' });
    }
});

router.get('/users', (req, res) => {
    // ⚠️ Security: In a real app, verify req.user.id is an Admin
    const users = db.prepare('SELECT * FROM users ORDER BY last_login DESC LIMIT 50').all();
    res.render('users', { user: req.user, usersList: users });
});

router.get('/logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100').all();
    res.render('logs', { user: req.user, logs: logs });
});

router.get('/settings', async (req, res) => {
    const guildId = req.query.guild_id;
    const client = require('../../bot/client');

    if (guildId) {
        // 1. Validate User Permissions
        const userGuilds = req.user.guilds || [];
        const guildData = userGuilds.find(g => g.id === guildId);

        if (!guildData || !((guildData.permissions & 0x8) === 0x8 || (guildData.permissions & 0x20) === 0x20)) {
            return res.redirect('/dashboard/servers'); // Unauthorized
        }

        // 2. Fetch Guild from Bot
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.render('error', { error: 'Bot is not in this guild. Please invite it first.' });
        }

        // 3. Prepare Data
        const channels = guild.channels.cache
            .filter(c => c.type === 0) // 0 = GUILD_TEXT
            .map(c => ({ id: c.id, name: c.name }));



        // Fetch Guild Settings from DB
        const settings = db.prepare('SELECT * FROM settings WHERE guild_id = ?').get(guildId);

        // Fetch Custom Commands
        const customCommands = db.prepare('SELECT * FROM custom_commands WHERE guild_id = ? ORDER BY created_at DESC').all(guildId);

        // Parse Ticket Categories
        let ticketCategories = [];
        try {
            if (settings && settings.ticket_categories) {
                ticketCategories = JSON.parse(settings.ticket_categories);
            }
        } catch (e) {
            console.error('Failed to parse ticket categories', e);
        }

        return res.render('settings', {
            user: req.user,
            mode: 'guild',
            guild: guild,
            channels: channels,
            settings: settings || {},
            customCommands: customCommands || [],
            ticketCategories: ticketCategories
        });
    }

    // Default: Global Settings (Bot Owner Only - intentionally left accessible for demo)
    res.render('settings', { user: req.user, mode: 'global' });
});

router.post('/settings', async (req, res) => {
    const { action, guild_id, channel_id } = req.body;
    const client = require('../../bot/client');
    const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

    try {
        if (action === 'send_announcement') {
            const channel = client.channels.cache.get(channel_id);
            if (!channel) throw new Error('Channel not found');

            const embed = new EmbedBuilder()
                .setTitle(req.body.title)
                .setDescription(req.body.description)
                .setColor(req.body.color || '#5865F2')
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }



        else if (action === 'update_welcome') {
            const { welcome_enabled, welcome_channel_id, welcome_message } = req.body;
            // welcome_enabled is '1' if checked, or undefined if unchecked (standard HTML form behavior)
            const isEnabled = welcome_enabled ? 1 : 0;

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, welcome_enabled, welcome_channel_id, welcome_message, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                welcome_enabled = excluded.welcome_enabled,
                welcome_channel_id = excluded.welcome_channel_id,
                welcome_message = excluded.welcome_message,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, isEnabled, welcome_channel_id, welcome_message);
        }

        else if (action === 'add_command') {
            const { trigger, response } = req.body;
            if (!trigger || !response) throw new Error('Trigger and Response are required');

            // Check if trigger already exists
            const existing = db.prepare('SELECT id FROM custom_commands WHERE guild_id = ? AND trigger = ?').get(guild_id, trigger);
            if (existing) throw new Error('This trigger already exists!');

            db.prepare('INSERT INTO custom_commands (guild_id, trigger, response) VALUES (?, ?, ?)').run(guild_id, trigger, response);
        }

        else if (action === 'delete_command') {
            const { command_id } = req.body;
            db.prepare('DELETE FROM custom_commands WHERE id = ? AND guild_id = ?').run(command_id, guild_id);
        }

        else if (action === 'update_automod') {
            const { automod_links, automod_badwords } = req.body;
            const blockLinks = automod_links ? 1 : 0;
            const badWords = automod_badwords || '';

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, automod_links, automod_badwords, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                automod_links = excluded.automod_links,
                automod_badwords = excluded.automod_badwords,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, blockLinks, badWords);
        }

        else if (action === 'update_leveling') {
            const { leveling_enabled } = req.body;
            const enabled = leveling_enabled ? 1 : 0;

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, leveling_enabled, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                leveling_enabled = excluded.leveling_enabled,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, enabled);
        }

        else if (action === 'add_ticket_category') {
            const { cat_label, cat_desc, cat_emoji } = req.body;

            // Get current settings
            const currentSettings = db.prepare('SELECT ticket_categories FROM settings WHERE guild_id = ?').get(guild_id);
            let categories = [];
            if (currentSettings && currentSettings.ticket_categories) {
                try { categories = JSON.parse(currentSettings.ticket_categories); } catch (e) { }
            }

            // Create new category object
            // Generate a simple value key
            const value = 'cat_' + Date.now();
            categories.push({
                label: cat_label,
                description: cat_desc,
                emoji: cat_emoji,
                value: value
            });

            // Save back
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, ticket_categories, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                ticket_categories = excluded.ticket_categories,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, JSON.stringify(categories));
        }

        else if (action === 'delete_ticket_category') {
            const { cat_value } = req.body;

            const currentSettings = db.prepare('SELECT ticket_categories FROM settings WHERE guild_id = ?').get(guild_id);
            let categories = [];
            if (currentSettings && currentSettings.ticket_categories) {
                try { categories = JSON.parse(currentSettings.ticket_categories); } catch (e) { }
            }

            categories = categories.filter(c => c.value !== cat_value);

            const stmt = db.prepare(`
                UPDATE settings SET ticket_categories = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?
            `);
            stmt.run(JSON.stringify(categories), guild_id);
        }

        res.redirect(`/dashboard/settings?guild_id=${guild_id}`);
    } catch (error) {
        console.error('Settings Action Error:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Leaderboard Public Route
router.get('/leaderboard/:guild_id', async (req, res) => {
    const guildId = req.params.guild_id;
    const client = require('../../bot/client');

    try {
        // Validation: Check if guild exists/bot is in it
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).send('Guild not found or Bot not added.');

        // Fetch Top 50 Users
        const leaderboard = db.prepare('SELECT user_id, xp, level FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT 50').all(guildId);

        // Enrich with User Data (Username, Avatar)
        // Note: Doing this sequentially might be slow if many users, but fine for 50. Promise.all better.
        const enrichedLeaderboard = await Promise.all(leaderboard.map(async (entry, index) => {
            let userTag = 'Unknown User';
            let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';

            try {
                // Try to fetch from cache first, then API
                let user = client.users.cache.get(entry.user_id);
                if (!user) {
                    user = await client.users.fetch(entry.user_id).catch(() => null);
                }

                if (user) {
                    userTag = user.username;
                    avatarUrl = user.displayAvatarURL({ extension: 'png', size: 64 });
                }
            } catch (e) { }

            return {
                rank: index + 1,
                username: userTag,
                avatar: avatarUrl,
                level: entry.level,
                xp: entry.xp
            };
        }));

        res.render('leaderboard', {
            guild: guild,
            leaderboard: enrichedLeaderboard
        });

    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).send('Server Error');
    }
});

// Transcript List Route
router.get('/transcripts/:guild_id', async (req, res) => {
    const guildId = req.params.guild_id;
    const client = require('../../bot/client');

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).send('Guild not found');

        const transcripts = db.prepare('SELECT id, channel_name, user_id, closed_at FROM ticket_transcripts WHERE guild_id = ? ORDER BY closed_at DESC LIMIT 50').all(guildId);

        // Enrich user names? maybe later. keeping it fast.

        res.render('transcripts', {
            guild: guild,
            transcripts: transcripts
        });
    } catch (error) {
        console.error('Transcript List Error:', error);
        res.status(500).send('Error');
    }
});

// View Specific Transcript
router.get('/transcripts/:guild_id/:ticket_id', async (req, res) => {
    const { guild_id, ticket_id } = req.params;
    try {
        const transcript = db.prepare('SELECT html_content FROM ticket_transcripts WHERE id = ? AND guild_id = ?').get(ticket_id, guild_id);

        if (!transcript) return res.status(404).send('Transcript not found');

        // Serve raw HTML
        res.send(transcript.html_content);
    } catch (error) {
        console.error('Transcript View Error:', error);
        res.status(500).send('Error');
    }
});

module.exports = router;
