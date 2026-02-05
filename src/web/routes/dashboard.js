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
    res.render('settings', { user: req.user });
});

router.post('/settings', (req, res) => {
    // Placeholder for settings update logic
    // db.prepare('UPDATE global_settings ...').run(...)
    res.redirect('/dashboard/settings');
});

module.exports = router;
