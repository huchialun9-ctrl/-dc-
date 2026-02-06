const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const db = require('../../database/db');

router.use(isAuthenticated);

router.get('/', (req, res) => {
    // Fetch stats from DB
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const ticketCount = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count;

    // Uptime
    const uptime = process.uptime();

    // Fetch Commands from Client
    const client = require('../../bot/client');
    let commandList = [];
    if (client.commands) {
        commandList = client.commands.map(cmd => ({
            name: cmd.data.name,
            description: cmd.data.description,
            // Assuming usage is stored in data or custom property. If not, fallback.
            usage: cmd.usage || `/${cmd.data.name}`,
            permissions: cmd.permissions || 'Everyone'
        }));
    }

    const guilds = client.guilds.cache.size;

    // Fetch Recent Activity (New for Redesign)
    let recentLogs = [];
    try {
        recentLogs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5').all();
    } catch (e) {
        logger.warn('Failed to fetch recent logs for dashboard:', e.message);
    }

    res.render('dashboard', {
        user: req.user || {},
        stats: {
            users: userCount || 0,
            tickets: ticketCount || 0,
            uptime: uptime || 0,
            guilds: guilds || 0
        },
        commands: commandList,
        recentLogs: recentLogs,
        // Chart data removed as per redesign, but keeping structure if needed for compatibility
        chart: { labels: [], data: [] }
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

router.get('/leaderboard/:guild_id/economy', async (req, res) => {
    const { guild_id } = req.params;
    const client = require('../../bot/client');

    const guild = client.guilds.cache.get(guild_id);
    if (!guild) return res.status(404).send('Guild not found');

    const topUsers = db.prepare('SELECT * FROM economy WHERE guild_id = ? ORDER BY balance DESC LIMIT 50').all(guild_id);

    // Fetch user details
    const leaderboard = await Promise.all(topUsers.map(async (entry, index) => {
        let userTag = 'Unknown User';
        let userAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
        try {
            const user = await client.users.fetch(entry.user_id);
            userTag = user.username;
            userAvatar = user.displayAvatarURL();
        } catch (e) { }

        return {
            rank: index + 1,
            username: userTag,
            avatar: userAvatar,
            balance: entry.balance
        };
    }));

    res.render('economy_leaderboard', { guild, leaderboard });
});

router.post('/settings', async (req, res) => {
    const { action, guild_id, channel_id } = req.body;
    const client = require('../../bot/client');
    const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

    try {
        if (action === 'send_announcement') {
            // Check if Announcement plugin is enabled
            const settings = db.prepare('SELECT announcement_enabled FROM settings WHERE guild_id = ?').get(guild_id);
            if (!settings || settings.announcement_enabled !== 1) {
                throw new Error('Announcement plugin is not installed/enabled.');
            }

            let channel;
            try {
                channel = await client.channels.fetch(channel_id);
            } catch (e) {
                channel = client.channels.cache.get(channel_id);
            }

            if (!channel) throw new Error('Channel not found or bot lacks access.');

            const embed = new EmbedBuilder()
                .setTitle(req.body.title || 'Announcement')
                .setDescription(req.body.description || 'No content provided.')
                .setColor(req.body.color || '#5865F2')
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            logger.info(`Announcement sent to ${channel_id} in guild ${guild_id}`);
        }



        else if (action === 'update_welcome') {
            const { welcome_channel_id, welcome_message } = req.body;

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, welcome_channel_id, welcome_message, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                welcome_channel_id = excluded.welcome_channel_id,
                welcome_message = excluded.welcome_message,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, welcome_channel_id, welcome_message);
        }

        else if (action === 'add_command') {
            const { trigger, response } = req.body;
            if (!trigger || !response) throw new Error('Trigger and Response are required');

            // Check Plugin Status
            const settings = db.prepare('SELECT custom_commands_enabled FROM settings WHERE guild_id = ?').get(guild_id);
            if (!settings || settings.custom_commands_enabled !== 1) {
                throw new Error('Custom Commands plugin is not enabled.');
            }

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
            const { automod_badwords } = req.body;
            const badWords = automod_badwords || '';

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, automod_badwords, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                automod_badwords = excluded.automod_badwords,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, badWords);
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

        else if (action === 'update_economy') {
            const { economy_enabled } = req.body;
            const enabled = economy_enabled ? 1 : 0;

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, economy_enabled, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                economy_enabled = excluded.economy_enabled,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, enabled);
        }

        else if (action === 'update_ai_chat') {
            const { ai_chat_enabled } = req.body;
            const enabled = ai_chat_enabled ? 1 : 0;

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, ai_chat_enabled, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                ai_chat_enabled = excluded.ai_chat_enabled,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, enabled);
        }

        else if (action === 'update_ai_config') {
            const { ai_channel_id } = req.body;
            // If empty string, treat as NULL
            const channelId = ai_channel_id ? ai_channel_id : null;

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, ai_channel_id, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                ai_channel_id = excluded.ai_channel_id,
                updated_at = CURRENT_TIMESTAMP
            `);

            stmt.run(guild_id, channelId);
        }

        // --- Phase 26: Plugin Store Toggle Handlers ---

        else if (action === 'update_announcement_toggle' || action === 'announcement') {
            const { announcement_enabled, enabled: ajaxEnabled } = req.body;
            const enabled = (announcement_enabled !== undefined ? announcement_enabled : ajaxEnabled) ? 1 : 0;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, announcement_enabled, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                announcement_enabled = excluded.announcement_enabled,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, enabled);
        }

        else if (action === 'update_music_toggle') {
            const { music_enabled } = req.body;
            const enabled = music_enabled ? 1 : 0;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, music_enabled, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                music_enabled = excluded.music_enabled,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, enabled);
        }

        else if (action === 'update_commands_toggle') {
            const { custom_commands_enabled } = req.body;
            const enabled = custom_commands_enabled ? 1 : 0;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, custom_commands_enabled, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                custom_commands_enabled = excluded.custom_commands_enabled,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, enabled);
        }

        else if (action === 'update_automod_toggle') {
            // Reusing automod_links as the main toggle for now, or automod_enabled?
            // The EJS sends 'automod_links'. Let's stick to that for backward compatibility or upgrade?
            // Problem: EJS sends `automod_links` as the plugin state.
            // But I added `automod_enabled` to DB.
            // Let's use `automod_enabled` as the master switch in DB, and keeping `automod_links` as a detail setting?
            // Actually, in settings.ejs I aliased the plugin state input name="automod_links".
            // So I should just update automod_links here.
            const { automod_links } = req.body;
            const enabled = automod_links ? 1 : 0;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, automod_links, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                automod_links = excluded.automod_links,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, enabled);
        }

        else if (action === 'update_welcome_toggle' || action === 'welcome') {
            // Logic already exists? Let's check.
            // It was called inside update_welcome_toggle block if it exists?
            // Let's ensure this block is consistent.
            const { welcome_enabled, enabled: ajaxEnabled } = req.body;
            const enabled = (welcome_enabled !== undefined ? welcome_enabled : ajaxEnabled) ? 1 : 0;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, welcome_enabled, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                welcome_enabled = excluded.welcome_enabled,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, enabled);
        }

        else if (action === 'update_economy_config') {
            const { economy_daily, economy_start_balance } = req.body;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, economy_daily, economy_start_balance, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                economy_daily = excluded.economy_daily,
                economy_start_balance = excluded.economy_start_balance,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, parseInt(economy_daily) || 100, parseInt(economy_start_balance) || 0);
        }

        else if (action === 'update_music_config') {
            const { music_volume } = req.body;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, music_volume, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                music_volume = excluded.music_volume,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, parseInt(music_volume) || 50);
        }

        else if (action === 'update_leveling_config') {
            const { leveling_rate } = req.body;
            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, leveling_rate, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET
                leveling_rate = excluded.leveling_rate,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guild_id, parseFloat(leveling_rate) || 1.0);
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

        // Brace removed from here (it was line 432 in faulty version)

        // Redirect Logic
        let redirectUrl = `/dashboard/settings?guild_id=${guild_id}`;
        if (req.body.open_module) {
            redirectUrl += `&open=${req.body.open_module}`;
        } else {
            // Heuristic: If action was a toggle and enabled=1, auto-open.
            // But managing this via hidden inputs in EJS is cleaner.
            // Let's rely on the POST body carrying a hint if we want to open it?
            // Or just hardcode mappings here.

            if (action === 'update_welcome_toggle' && req.body.welcome_enabled) redirectUrl += '&open=welcome';
            if (action === 'update_ai_chat' && req.body.ai_chat_enabled) redirectUrl += '&open=ai';
            if (action === 'update_automod_toggle' && req.body.automod_links) redirectUrl += '&open=automod';
            if (action === 'update_announcement_toggle' && req.body.announcement_enabled) redirectUrl += '&open=announcement';
            if (action === 'update_commands_toggle' && req.body.custom_commands_enabled) redirectUrl += '&open=commands';
            // External link modules (Music, Economy) - maybe just highlight them or scroll to them?
            // For now, let's just reload the grid for them.
        }

        // AJAX Support for Instant Toggles
        if (req.headers.accept && req.headers.accept.includes('application/json') || req.body.ajax) {
            return res.json({ success: true, message: 'Settings updated successfully' });
        }

        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Settings Action Error:', error);

        // Support JSON Error Response
        if (req.headers.accept && req.headers.accept.includes('application/json') || req.body.ajax) {
            return res.status(500).json({ success: false, message: error.message });
        }

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

// Music Controller Route
router.get('/music/:guild_id', async (req, res) => {
    const guildId = req.params.guild_id;
    const client = require('../../bot/client');

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).send('Guild not found');

        const queue = client.distube.getQueue(guildId);
        const songs = queue ? queue.songs : [];
        const isPlaying = queue ? queue.playing : false;
        const volume = queue ? queue.volume : 50;

        // Current Song
        const currentSong = songs.length > 0 ? songs[0] : null;

        res.render('music', {
            guild: guild,
            queue: songs,
            currentSong: currentSong,
            isPlaying: isPlaying,
            volume: volume
        });
    } catch (error) {
        console.error('Music Page Error:', error);
        res.status(500).send('Error');
    }
});

// Music Actions API
router.post('/music/:guild_id/action', async (req, res) => {
    const guildId = req.params.guild_id;
    const { action, value } = req.body; // action: play, pause, resume, skip, stop, volume
    const client = require('../../bot/client');

    try {
        const queue = client.distube.getQueue(guildId);

        if (!queue && action !== 'play') { // Play might work without queue if URL provided (not impl here yet)
            return res.json({ success: false, message: 'No queue active' });
        }

        switch (action) {
            case 'pause':
                if (queue) queue.pause();
                break;
            case 'resume':
                if (queue) queue.resume();
                break;
            case 'skip':
                if (queue) await queue.skip().catch(() => { });
                break;
            case 'stop':
                if (queue) queue.stop();
                break;
            case 'volume':
                if (queue) queue.setVolume(parseInt(value));
                break;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Music Action Error:', error);
        res.json({ success: false, message: error.message });
    }
});

module.exports = router;
