const { Events } = require('discord.js');
const logger = require('../../core/logger');
const TicketService = require('../services/ticketService');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction);
            }

            else if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
                const { values, guild, user } = interaction;
                const categoryType = values[0];

                await interaction.deferReply({ ephemeral: true });

                try {
                    const result = await TicketService.createTicket(guild, user, categoryType);
                    if (result.error) {
                        return interaction.editReply({ content: result.error });
                    }
                    await interaction.editReply({ content: `✅ Ticket created: ${result.channel}` });
                } catch (err) {
                    logger.error(err);
                    await interaction.editReply({ content: 'Failed to create ticket. Please contact admin.' });
                }
            }

            else if (interaction.isButton() && interaction.customId === 'close_ticket') {
                const { channel, user } = interaction;
                await interaction.deferReply();
                await TicketService.closeTicket(channel, user);
            }

        } catch (error) {
            logger.error('Interaction Error: ' + error.message);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'Generic Error!', ephemeral: true }).catch(() => { });
            }
        }
    },
};
