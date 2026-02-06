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
                await interaction.reply({ content: '🔒 正在準備關閉工單...', ephemeral: true });
                await TicketService.closeTicket(channel, user);
            }

            else if (interaction.isButton() && interaction.customId === 'claim_ticket') {
                const result = await TicketService.claimTicket(interaction.channel, interaction.user);
                if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
                return interaction.reply({ content: '✅ 您已成功領取此工單。', ephemeral: true });
            }

            // --- Control Panel Handlers ---
            else if (interaction.isButton() && interaction.customId.startsWith('panel_')) {
                const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const db = require('../../database/db');

                if (interaction.customId === 'panel_music') {
                    const queue = interaction.client.distube.getQueue(interaction.guildId);
                    const embed = new EmbedBuilder()
                        .setTitle('🎵 音樂面板 (Music Panel)')
                        .setColor('#F5576C');

                    const controls = new ActionRowBuilder();

                    if (!queue) {
                        embed.setDescription('目前沒有音樂正在播放 (No music playing).');
                        // Disable controls if no queue but show placeholder
                        controls.addComponents(
                            new ButtonBuilder().setCustomId('music_play_dummy').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true)
                        );
                    } else {
                        const song = queue.songs[0];
                        embed.setDescription(`**正在播放:** [${song.name}](${song.url})\n**時間:** ${queue.formattedCurrentTime} / ${song.formattedDuration}\n**佇列:** ${queue.songs.length} 首歌曲`);
                        embed.setThumbnail(song.thumbnail);

                        controls.addComponents(
                            new ButtonBuilder().setCustomId(queue.paused ? 'music_resume' : 'music_pause').setEmoji(queue.paused ? '▶️' : '⏸️').setStyle(queue.paused ? ButtonStyle.Success : ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary)
                        );
                    }
                    await interaction.reply({ embeds: [embed], components: controls.components.length > 0 ? [controls] : [], ephemeral: true });
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
                        content: '🎉 **一鍵抽獎設定**\n請使用 `/giveaway start` 指令來開始一個新的抽獎活動。',
                        ephemeral: true
                    });
                }
            }

            else if (interaction.isButton() && interaction.customId.startsWith('music_')) {

                const queue = interaction.client.distube.getQueue(interaction.guildId);
                if (!queue) return interaction.reply({ content: '❌ 目前沒有音樂正在播放！', ephemeral: true });

                const action = interaction.customId;
                try {
                    if (action === 'music_pause') {
                        queue.pause();
                        await interaction.reply({ content: '⏸️ 音樂已暫停', ephemeral: true });
                    } else if (action === 'music_resume') {
                        queue.resume();
                        await interaction.reply({ content: '▶️ 音樂已繼續播放', ephemeral: true });
                    } else if (action === 'music_skip') {
                        await queue.skip();
                        await interaction.reply({ content: '⏭️ 已跳過歌曲', ephemeral: true });
                    } else if (action === 'music_stop') {
                        queue.stop();
                        await interaction.reply({ content: '⏹️ 已停止播放並清空佇列', ephemeral: true });
                    } else if (action === 'music_shuffle') {
                        queue.shuffle();
                        await interaction.reply({ content: '🔀 已隨機播放佇列', ephemeral: true });
                    }
                } catch (e) {
                    await interaction.reply({ content: `❌ 操作失敗: ${e.message}`, ephemeral: true });
                }
            }

            // --- Role Claim System ---
            else if (interaction.isButton() && interaction.customId.startsWith('claim_role_')) {
                const roleId = interaction.customId.replace('claim_role_', '');
                const role = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: '❌ 找不到該身分組，可能已被刪除。', ephemeral: true });
                }

                const member = interaction.member; // GuildMember
                try {
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId);
                        await interaction.reply({ content: `➖ 已移除 **${role.name}** 身分組。`, ephemeral: true });
                    } else {
                        await member.roles.add(roleId);
                        await interaction.reply({ content: `➕ 已領取 **${role.name}** 身分組！`, ephemeral: true });
                    }
                } catch (error) {
                    await interaction.reply({ content: '❌ 無法變更身分組，請檢查機器人權限。', ephemeral: true });
                }
            }



            // --- Admin Panel Buttons ---
            else if (interaction.isButton() && interaction.customId.startsWith('admin_')) {
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                const action = interaction.customId.split('_')[1]; // kick, ban, timeout, clear

                const modal = new ModalBuilder()
                    .setCustomId(`modal_admin_${action}`)
                    .setTitle(`${action.toUpperCase()} User`);

                if (action === 'kick' || action === 'ban') {
                    const userIdInput = new TextInputBuilder()
                        .setCustomId('target_id')
                        .setLabel("Target User ID")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('reason')
                        .setLabel("Reason")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(userIdInput),
                        new ActionRowBuilder().addComponents(reasonInput)
                    );
                } else if (action === 'timeout') {
                    const userIdInput = new TextInputBuilder()
                        .setCustomId('target_id')
                        .setLabel("Target User ID")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const durationInput = new TextInputBuilder()
                        .setCustomId('duration')
                        .setLabel("Duration (minutes)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(userIdInput),
                        new ActionRowBuilder().addComponents(durationInput)
                    );
                } else if (action === 'clear') {
                    const amountInput = new TextInputBuilder()
                        .setCustomId('amount')
                        .setLabel("Amount (1-100)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
                }

                await interaction.showModal(modal);
            }

            // --- Admin Panel Modals ---
            else if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_admin_')) {
                const action = interaction.customId.replace('modal_admin_', '');
                await interaction.deferReply({ ephemeral: true });

                try {
                    const targetId = interaction.fields.getTextInputValue('target_id');

                    if (action === 'clear') {
                        const amount = parseInt(interaction.fields.getTextInputValue('amount'));
                        if (isNaN(amount) || amount < 1 || amount > 100) {
                            return interaction.editReply('❌ 請輸入 1-100 之間的數字。');
                        }
                        const deleted = await interaction.channel.bulkDelete(amount, true);
                        return interaction.editReply(`🧹 已刪除 ${deleted.size} 條訊息。`);
                    }

                    // For interactions targeting members
                    const member = await interaction.guild.members.fetch(targetId).catch(() => null);
                    if (!member) {
                        return interaction.editReply('❌ 找不到該成員 (Invalid ID)。');
                    }

                    if (action === 'kick') {
                        const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided';
                        await member.kick(reason);
                        return interaction.editReply(`🦶 已踢出 **${member.user.tag}**\n原因: ${reason}`);
                    }
                    else if (action === 'ban') {
                        const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided';
                        await member.ban({ reason });
                        return interaction.editReply(`🚫 已封鎖 **${member.user.tag}**\n原因: ${reason}`);
                    }
                    else if (action === 'timeout') {
                        const duration = parseInt(interaction.fields.getTextInputValue('duration'));
                        if (isNaN(duration)) return interaction.editReply('❌ 無效的時間 (需要分鐘數)。');
                        await member.timeout(duration * 60 * 1000, 'Admin Panel Timeout');
                        return interaction.editReply(`⏳ 已禁言 **${member.user.tag}** ${duration} 分鐘。`);
                    }

                } catch (error) {
                    return interaction.editReply(`❌ 操作失敗: ${error.message}`);
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
