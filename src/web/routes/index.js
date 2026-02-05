const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

router.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// OAuth2 Callback Route (Must match REDIRECT_URI in .env)
router.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/dashboard');
});

// Invite Bot Support (Securely generates state)
router.get('/invite', (req, res, next) => {
    // Determine options based on query
    const options = {
        scope: ['identify', 'guilds', 'bot', 'applications.commands', 'applications.entitlements'],
        permissions: 8
    };

    // If guild_id is present, we try to pass it to Discord.
    // Note: passport-discord may strictly filter options, so this depends on the library version.
    // If it doesn't work, the user simply has to select the server manually, which is acceptable.
    if (req.query.guild_id) {
        options.guildId = req.query.guild_id;
        options.disableGuildSelect = true;
    }

    passport.authenticate('discord', options)(req, res, next);
});

router.get('/privacy', (req, res) => {
    res.render('privacy', { user: req.user });
});

router.get('/terms', (req, res) => {
    res.render('terms', { user: req.user });
});

module.exports = router;
