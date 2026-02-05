const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('📢 讓機器人說話 (僅管理員) | Make the bot speak (Admin only)')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('要發送的訊息 | Message to send')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('要發送的頻道 (選填) | Channel to send (Optional)')
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        // Check if bot can send to that channel
        if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
            return interaction.reply({ content: '❌ 我沒有權限在該頻道發送訊息！', ephemeral: true });
        }

        await channel.send({ content: message });

        // Reply ephemerally to confirm
        await interaction.reply({ content: `✅ 訊息已發送至 ${channel}`, ephemeral: true });
    },
};
