const { Events } = require('discord.js');
const logger = require('../../core/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Logged in as ${client.user.tag}`);

        // Initialize Services
        if (client.giveawayService) {
            client.giveawayService.init();
            logger.info('GiveawayService initialized.');
        }
    },
};
