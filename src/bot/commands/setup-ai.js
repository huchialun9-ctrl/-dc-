const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');
const mongo = require('../../database/mongo');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ai')
        .setDescription('設定 AI 對話專用頻道 (Set AI Chat Channel)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('選擇要綁定的頻道 (Select Channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),

    async execute(interaction) {
        if (!mongo.getIsConnected()) return interaction.reply({ content: '資料庫未連線。', ephemeral: true });

        const channel = interaction.options.getChannel('channel');

        try {
            await GuildSettings.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { 'ai.channelId': channel.id, 'ai.enabled': true },
                { upsert: true }
            );

            await interaction.reply({
                content: `✅ **設定完成！**\n現在 AI 對話已綁定至 ${channel}，且只有在該頻道 **提及 (Tag)** 機器人才會回應。`,
                ephemeral: false
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ 設定失敗，請稍後再試。', ephemeral: true });
        }
    }
};
