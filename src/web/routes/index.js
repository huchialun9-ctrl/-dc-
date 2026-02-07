const express = require('express');
const router = express.Router();
const passport = require('passport');

// Redirect root to dashboard
router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

router.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// OAuth2 Callback Route
router.get('/callback', (req, res, next) => {
    console.log('[AUTH DEBUG] Reached /callback');
    next();
}, (req, res, next) => {
    passport.authenticate('discord', { failureRedirect: '/dashboard' })(req, res, (err) => {
        if (err) return next(err);
        console.log(`[AUTH DEBUG] Callback success for user: ${req.user?.username}. Saving session...`);
        req.session.save((err) => {
            if (err) {
                console.error('[AUTH DEBUG] Session save error:', err);
                return res.redirect('/dashboard?error=session_save_failed');
            }
            console.log('[AUTH DEBUG] Session saved. Redirecting to dashboard.');
            res.redirect('/dashboard');
        });
    });
});

// Invite Bot
router.get('/invite', (req, res, next) => {
    const options = {
        scope: ['identify', 'guilds', 'bot', 'applications.commands'],
        permissions: 8
    };

    if (req.query.guild_id) {
        options.guildId = req.query.guild_id;
        options.disableGuildSelect = true;
    }

    passport.authenticate('discord', options)(req, res, next);
});

module.exports = router;
