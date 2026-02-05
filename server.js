require('dotenv').config();
const app = require('./src/core/app');
const logger = require('./src/core/logger');
const client = require('./src/bot/client'); // Bot logic

// --- Server Startup ---
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    logger.info(`Web Server running on port ${PORT}`);
});

// --- Bot Startup ---
client.login(process.env.BOT_TOKEN).then(() => {
    logger.info(`Bot logged in as ${client.user.tag}`);
}).catch(err => {
    logger.error(`Bot Login Failed: ${err.message}`);
});
