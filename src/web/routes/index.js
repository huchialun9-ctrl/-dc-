const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

router.get('/health', (req, res) => {
    res.status(200).send('OK');
});

router.get('/privacy', (req, res) => {
    res.render('privacy', { user: req.user });
});

router.get('/terms', (req, res) => {
    res.render('terms', { user: req.user });
});

module.exports = router;
