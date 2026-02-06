const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('開啟功能控制面板 (Open Control Panel)'),

    async execute(interaction) {
        // Embed providing quick feature shortcuts
        const embed = new EmbedBuilder()
            .setTitle('🎮 VX6 控制面板')
            .setDescription('請選擇下方功能捷徑：')
            .setColor('#5865F2')
            .addFields(
                { name: '🎉 一鍵抽獎', value: '快速設定並開始活動', inline: true },
                { name: '🎵 音樂面板', value: '開啟點歌與播放控制', inline: true },
                { name: '📜 系統日誌', value: '查看機器人運作紀錄', inline: true },
                { name: '📘 使用手冊', value: '完整的指令與教學', inline: true }
            );

        // Buttons
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('一鍵抽獎')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId('panel_giveaway'),
                new ButtonBuilder()
                    .setLabel('音樂面板')
                    .setEmoji('🎵')
                    .setStyle(ButtonStyle.Success)
                    .setCustomId('panel_music')
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('系統日誌')
                    .setEmoji('📜')
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('panel_logs'),
                new ButtonBuilder()
                    .setLabel('使用手冊')
                    .setEmoji('📘')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://dc-production-b215.up.railway.app/')
            );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
};
