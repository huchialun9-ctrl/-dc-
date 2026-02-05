const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('🎲 擲骰子 (1-6) | Roll a dice (1-6)'),
    async execute(interaction) {
        const result = Math.floor(Math.random() * 6) + 1;

        await interaction.reply({
            content: `🎲 你擲出了: **${result}**`,
        });
    },
};
