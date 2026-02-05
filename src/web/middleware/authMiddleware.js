function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/discord');
}

function isAuthorized(req, res, next) {
    // Placeholder for role-based access if needed later
    next();
}

module.exports = { isAuthenticated, isAuthorized };
