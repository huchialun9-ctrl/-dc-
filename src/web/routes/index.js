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

router.get('/invite', (req, res) => {
    let inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&integration_type=0&scope=identify+guilds.members.read+guilds.join+email+guilds+guilds.channels.read+bot+applications.commands+applications.entitlements+presences.write`;

    if (req.query.guild_id) {
        inviteUrl += `&guild_id=${req.query.guild_id}&disable_guild_select=true`;
    }

    res.redirect(inviteUrl);
});

router.get('/privacy', (req, res) => {
    res.render('privacy', { user: req.user });
});

router.get('/terms', (req, res) => {
    res.render('terms', { user: req.user });
});

module.exports = router;
