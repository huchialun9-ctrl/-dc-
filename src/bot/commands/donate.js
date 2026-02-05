const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donate')
        .setDescription('☕ 支持開發者 | Support the developer'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💖 支持開發者 | Support Us')
            .setDescription('如果您喜歡這個機器人，歡迎請我喝杯咖啡！您的支持是我持續更新的最大動力。\n\nIf you like this bot, consider buying me a coffee! Your support keeps the updates coming.')
            .setColor('#FFDD00')
            .setThumbnail('https://cdn.buymeacoffee.com/buttons/1.0.0/icon.png');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('請我喝杯咖啡 (Buy Me a Coffee)')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://buymeacoffee.com/lucas1126')
                    .setEmoji('☕')
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
