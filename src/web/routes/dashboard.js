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
    // 取得使用者所在的伺服器 (假設 Passport 已將 guilds 存入 req.user)
    // 如果 req.user.guilds 不存在，這裡會報錯或顯示空。
    // 實務上通常需要在 callback 中處理 guilds fetch，或者這裡重新 fetch (需要 access token)。
    // 為了展示，這裡假設 req.user.guilds 有資料，如果沒有則顯示空陣列並提示。
    const userGuilds = req.user.guilds || [];

    // 簡單過濾：只顯示使用者有管理權限的伺服器 (0x8 = Administrator, 0x20 = Manage Guild)
    // Permission 計算有點複雜，這裡先列出全部做展示

    res.render('servers', { user: req.user, guilds: userGuilds });
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
