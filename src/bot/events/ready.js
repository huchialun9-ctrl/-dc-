const { Events, ActivityType } = require('discord.js');
const logger = require('../../core/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Logged in as ${client.user.tag}`);

        // Rotating Presence
        const statuses = [
            { state: 'AI 伺服器建構中', type: ActivityType.Custom },
            { name: 'AI Server Manager', type: ActivityType.Playing },
            { name: 'GPT-4o Orchestrator', type: ActivityType.Playing }
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
    },
};
