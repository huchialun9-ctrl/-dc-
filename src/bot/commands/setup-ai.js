const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database/db');

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
        const channel = interaction.options.getChannel('channel');

        try {
            // Update settings
            const stmt = db.prepare('INSERT INTO settings (guild_id, ai_channel_id, ai_chat_enabled) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO UPDATE SET ai_channel_id = ?, ai_chat_enabled = 1');
            stmt.run(interaction.guild.id, channel.id, channel.id);

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
