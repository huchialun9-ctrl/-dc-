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

            // Role Claim System
            else if (interaction.isButton() && interaction.customId.startsWith('role_claim_')) {
                const roleId = interaction.customId.replace('role_claim_', '');
                const role = interaction.guild.roles.cache.get(roleId);
                const member = interaction.member;

                if (!role) {
                    return interaction.reply({ content: '❌ 找不到該身分組，它可能已被刪除。', ephemeral: true });
                }

                // Check Bot Perms
                if (!interaction.guild.members.me.permissions.has('ManageRoles') || role.position >= interaction.guild.members.me.roles.highest.position) {
                    return interaction.reply({ content: '❌ 機器人權限不足，無法分配此身分組。請檢查機器人身分組順序。', ephemeral: true });
                }

                try {
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role);
                        await interaction.reply({ content: `✅ 已移除 **${role.name}** 身分組。`, ephemeral: true });
                    } else {
                        await member.roles.add(role);
                        await interaction.reply({ content: `✅ 已獲得 **${role.name}** 身分組！`, ephemeral: true });
                    }
                } catch (err) {
                    logger.error(`Role handling error: ${err.message}`);
                    await interaction.reply({ content: '❌ 操作失敗，請稍後再試。', ephemeral: true });
                }
            }

        } catch (error) {
            logger.error('Interaction Error: ' + error.message);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'Generic Error!', ephemeral: true }).catch(() => { });
            }
        }
    },
};
