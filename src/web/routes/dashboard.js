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

        const roles = guild.roles.cache
            .filter(r => !r.managed && r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));

        // Force fetch emojis to ensure we have custom ones
        await guild.emojis.fetch();
        const emojis = guild.emojis.cache.map(e => ({
            id: e.id,
            name: e.name,
            url: e.url,
            identifier: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`
        }));

        // Fetch Guild Settings from DB
        const settings = db.prepare('SELECT * FROM settings WHERE guild_id = ?').get(guildId);

        return res.render('settings', {
            user: req.user,
            mode: 'guild',
            guild: guild,
            channels: channels,
            roles: roles,
            emojis: emojis,
            settings: settings || {} // Pass empty obj if null
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

        else if (action === 'create_role_claim') {
            const channel = client.channels.cache.get(channel_id);
            if (!channel) throw new Error('Channel not found');

            const rolesData = req.body.roles || [];
            if (rolesData.length === 0) throw new Error('請至少新增一個身分組按鈕');

            // Construct Buttons
            const components = [];
            let currentRow = new ActionRowBuilder();

            rolesData.forEach((item, index) => {
                // Determine Emoji (if custom string format <a:name:id>, pass id? No, ButtonBuilder takes full string or unicode)
                // Actually discord.js ButtonBuilder.setEmoji() takes an emoji ID or unicode string.

                const button = new ButtonBuilder()
                    .setCustomId(`role_claim_${item.role_id}`)
                    .setLabel(item.label)
                    .setStyle(ButtonStyle.Success);

                if (item.emoji) {
                    button.setEmoji(item.emoji);
                }

                currentRow.addComponents(button);

                // Max 5 buttons per row
                if ((index + 1) % 5 === 0 || index === rolesData.length - 1) {
                    components.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
            });

            const embed = new EmbedBuilder()
                .setTitle(req.body.embed_title || '身分組領取')
                .setDescription(req.body.description || '點擊下方按鈕以領取/移除對應身分組。')
                .setColor('#43b581')
                .setFooter({ text: `共 ${rolesData.length} 個身分組可供領取` });

            await channel.send({ embeds: [embed], components: components });
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

        res.redirect(`/dashboard/settings?guild_id=${guild_id}`);
    } catch (error) {
        console.error('Settings Action Error:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

module.exports = router;
