const { Events, ActivityType } = require('discord.js');
const logger = require('../../core/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Logged in as ${client.user.tag}`);

        // Rotating Presence
        const statuses = [
            { state: '為民服務中', type: ActivityType.Custom },
            { name: 'VCT', type: ActivityType.Playing },
            { name: 'Valorant', type: ActivityType.Playing }
        ];

        let i = 0;
        setInterval(() => {
            const status = statuses[i];
            client.user.setPresence({
                activities: [{
                    name: status.name || 'custom',
                    type: status.type,
                    state: status.state
                }],
                status: 'online',
            });
            i = (i + 1) % statuses.length;
        }, 10000);

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
