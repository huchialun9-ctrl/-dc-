const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login Route
router.get('/discord', passport.authenticate('discord'));

// Logout Route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            // Log the error or handle it appropriately without calling next()
            console.error("Logout error:", err);
            return res.redirect('/error'); // Or some other error handling
        }
        res.redirect('/');
    });
});

module.exports = router;
