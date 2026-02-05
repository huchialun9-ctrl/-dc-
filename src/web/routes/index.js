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

router.get('/privacy', (req, res) => {
    res.render('privacy', { user: req.user });
});

router.get('/terms', (req, res) => {
    res.render('terms', { user: req.user });
});

module.exports = router;
