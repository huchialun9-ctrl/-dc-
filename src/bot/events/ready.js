const { Events, ActivityType } = require('discord.js');
const logger = require('../../core/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Logged in as ${client.user.tag}`);

        // Set Presence to "Watching VCT"
        client.user.setPresence({
            activities: [{
                name: 'VCT',
                type: ActivityType.Watching
            }],
            status: 'online',
        });

        // Initialize Services
        if (client.giveawayService) {
            client.giveawayService.init();
            logger.info('GiveawayService initialized.');
        }

        if (client.earthquakeService) {
            client.earthquakeService.init();
        }
    },
};
