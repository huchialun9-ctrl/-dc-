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

    // Guilds (from Bot - requires passing bot client or IPC, simplified for now)
    // In V3, we might store guild states in DB or use a Service to fetch
    const guilds = '1 (Synced)';

    res.render('dashboard', {
        user: req.user,
        stats: {
            users: userCount,
            tickets: ticketCount,
            uptime: uptime,
            guilds: guilds
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

router.get('/settings', (req, res) => {
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

        return res.render('settings', {
            user: req.user,
            mode: 'guild',
            guild: guild,
            channels: channels,
            roles: roles
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

            const embed = new EmbedBuilder()
                .setTitle(req.body.embed_title || '身分組領取')
                .setDescription(`點擊下方按鈕以領取身分組 <@&${req.body.role_id}>`)
                .setColor('#43b581');

            const button = new ButtonBuilder()
                .setCustomId(`role_claim_${req.body.role_id}`)
                .setLabel(req.body.button_label)
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(button);

            await channel.send({ embeds: [embed], components: [row] });
        }

        res.redirect(`/dashboard/settings?guild_id=${guild_id}`);
    } catch (error) {
        console.error('Settings Action Error:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

module.exports = router;
