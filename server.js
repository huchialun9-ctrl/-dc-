require('dotenv').config();
const app = require('./src/core/app');
const logger = require('./src/core/logger');
const client = require('./src/bot/client'); // Bot logic

// --- Server Startup ---
// --- Server Startup ---
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    logger.info(`🚀 Web Server running on port ${PORT}`);

    // --- Bot & Commands Startup (Non-blocking) ---
    (async () => {
        try {
            // 1. Deploy Commands (Optional: Can be moved to a separate lifecycle or run here)
            // logger.info('Refreshing application (/) commands...');
            // require('./src/bot/deploy-commands'); 

            // 2. Bot Login
            await client.login(process.env.BOT_TOKEN);
            logger.info(`✅ Bot logged in as ${client.user.tag}`);
        } catch (err) {
            logger.error(`❌ Bot Startup Failed: ${err.message}`);
        }
    })();
});
