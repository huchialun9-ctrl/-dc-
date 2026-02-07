const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');
const mongo = require('../../database/mongo');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('⚙️ 伺服器 AI 配置中心 (AI Configuration)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('ai')
                .setDescription('配置 AI 專用頻道與狀態')
                .addChannelOption(opt => opt.setName('channel').setDescription('AI 專用頻道').addChannelTypes(ChannelType.GuildText))
                .addStringOption(opt => opt.setName('status').setDescription('啟用狀態').addChoices({ name: '開啟', value: 'on' }, { name: '關閉', value: 'off' }))
        ),

    async execute(interaction) {
        if (!mongo.getIsConnected()) return interaction.reply({ content: '資料庫未連線。', ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const embed = new EmbedBuilder().setColor('#5865F2').setTimestamp();

        try {
            if (subcommand === 'ai') {
                const channel = interaction.options.getChannel('channel');
                const status = interaction.options.getString('status');
                const update = {};
                if (status) update['ai.enabled'] = status === 'on';
                if (channel) update['ai.channelId'] = channel.id;

                await GuildSettings.findOneAndUpdate({ guildId }, update, { upsert: true });
                embed.setTitle('🧠 AI 配置已更新').setDescription(`狀態: ${status || '未變動'}\n頻道: ${channel || '未變動'}`);
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ 配置更新失敗，請稍後再試。', ephemeral: true });
        }
    }
};
