const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('🖼️ 顯示使用者頭貼 | Display user avatar')
        .addUserOption(option => option.setName('target').setDescription('目標使用者 (Target User)')),
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const guildMember = await interaction.guild.members.fetch(target.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle(`${target.username} 的頭貼`)
            .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor('#3498db')
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        // If user has specific server avatar, show it too or link to it
        if (guildMember && guildMember.avatar) {
            embed.setThumbnail(guildMember.displayAvatarURL({ dynamic: true, size: 512 }));
            embed.setDescription('**提示**: 右下角小圖是伺服器專屬頭貼 (Server Avatar)');
        }

        await interaction.reply({ embeds: [embed] });
    },
};
