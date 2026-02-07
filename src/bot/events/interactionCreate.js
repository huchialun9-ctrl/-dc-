const { Events } = require('discord.js');
const logger = require('../../core/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction);
            }
        } catch (error) {
            logger.error('Interaction Error: ' + error.message);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: '❌ 發生錯誤: ' + error.message, ephemeral: true }).catch(() => { });
            } else {
                await interaction.reply({ content: '❌ 發生錯誤: ' + error.message, ephemeral: true }).catch(() => { });
            }
        }
    },
};
