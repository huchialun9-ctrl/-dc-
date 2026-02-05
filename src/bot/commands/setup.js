const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('⚙️ 快速設定系統 | Quick setup system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('transcripts')
                .setDescription('The channel to send ticket transcripts to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('transcripts');

        // Upsert Settings
        const stmt = db.prepare(`
            INSERT INTO settings (guild_id, log_channel_id, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(guild_id) DO UPDATE SET 
            log_channel_id = excluded.log_channel_id,
            updated_at = CURRENT_TIMESTAMP
        `);
        stmt.run(interaction.guildId, channel.id);

        // Log setup action
        db.prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)").run(interaction.user.id, 'CONFIG_CHANGE', `Set log channel to ${channel.id}`);

        await interaction.reply({ content: `Configuration saved! Transcripts will be sent to ${channel}.`, ephemeral: true });
    },
};
