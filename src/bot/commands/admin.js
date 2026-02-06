const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('開啟伺服器管理面板 (Open Management Panel)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ 伺服器管理面板 (Admin Panel)')
            .setDescription('請選擇下方功能來執行管理操作：\n\n' +
                '🔘 **踢出 (Kick)** - 踢出成員\n' +
                '🚫 **封鎖 (Ban)** - 永久封鎖成員\n' +
                '⏳ **禁言 (Timeout)** - 暫時禁言成員\n' +
                '🧹 **清理 (Clear)** - 批量刪除訊息')
            .setColor('#2B2D31')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: '安全操作 • 請謹慎使用' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('admin_kick')
                    .setLabel('踢出 (Kick)')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🦶'),
                new ButtonBuilder()
                    .setCustomId('admin_ban')
                    .setLabel('封鎖 (Ban)')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔨'),
                new ButtonBuilder()
                    .setCustomId('admin_timeout')
                    .setLabel('禁言 (Timeout)')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏳'),
                new ButtonBuilder()
                    .setCustomId('admin_clear')
                    .setLabel('清理 (Clear)')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🧹')
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
