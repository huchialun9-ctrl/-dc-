const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('📊 建立簡單投票 | Create a simple poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('投票問題 | Poll Question')
                .setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');

        const embed = new EmbedBuilder()
            .setTitle('📊 投票 | Poll')
            .setDescription(`**${question}**`)
            .setColor('#f1c40f')
            .setFooter({ text: `發起人: ${interaction.user.tag}` })
            .setTimestamp();

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('👍');
        await message.react('👎');
    },
};
