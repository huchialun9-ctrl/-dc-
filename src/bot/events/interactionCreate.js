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

            // --- Control Panel Handlers ---
            else if (interaction.isButton() && interaction.customId.startsWith('panel_')) {
                const { EmbedBuilder } = require('discord.js');
                const db = require('../../database/db');

                if (interaction.customId === 'panel_music') {
                    const queue = interaction.client.distube.getQueue(interaction.guildId);
                    const embed = new EmbedBuilder()
                        .setTitle('🎵 音樂面板 (Music Panel)')
                        .setColor('#F5576C');

                    if (!queue) {
                        embed.setDescription('目前沒有音樂正在播放 (No music playing).');
                    } else {
                        const song = queue.songs[0];
                        embed.setDescription(`**正在播放:** [${song.name}](${song.url})\n**時間:** ${queue.formattedCurrentTime} / ${song.formattedDuration}\n**佇列:** ${queue.songs.length} 首歌曲`);
                        embed.setThumbnail(song.thumbnail);
                    }
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }

                else if (interaction.customId === 'panel_logs') {
                    // Fetch recent logs
                    const logs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5').all();
                    const embed = new EmbedBuilder()
                        .setTitle('📜 最近系統日誌 (System Logs)')
                        .setColor('#4FACFE');

                    if (logs.length === 0) {
                        embed.setDescription('尚無紀錄。');
                    } else {
                        const logText = logs.map(l => `\`[${l.created_at}]\` ${l.action}: ${l.details}`).join('\n');
                        embed.setDescription(logText.substring(0, 4000)); // Prevent overflow
                    }
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }

                else if (interaction.customId === 'panel_giveaway') {
                    await interaction.reply({
                        content: '🎉 **一鍵抽獎設定**\n請使用 `/giveaway start` 指令來開始一個新的抽獎活動，或是前往 [控制台](https://dc-production-b215.up.railway.app/dashboard) 進行詳細設定。',
                        ephemeral: true
                    });
                }
            }


        } catch (error) {
            logger.error('Interaction Error: ' + error.message);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: '❌ 發生錯誤 (Error): ' + error.message, ephemeral: true }).catch(() => { });
            } else {
                await interaction.reply({ content: '❌ 發生錯誤 (Error): ' + error.message, ephemeral: true }).catch(() => { });
            }
        }
    },
};
