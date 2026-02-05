const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 測試機器人延遲 | Check bot latency'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '機器人延遲 (Bot Latency)', value: `${latency}ms`, inline: true },
                { name: 'API 延遲 (API Latency)', value: `${apiLatency}ms`, inline: true }
            );

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};
