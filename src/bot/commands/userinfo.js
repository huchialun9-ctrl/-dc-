const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('👤 顯示使用者詳細資訊 | Display user information')
        .addUserOption(option => option.setName('target').setDescription('要查詢的使用者 (預設為自己) | Target user')),
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        const embed = new EmbedBuilder()
            .setTitle(`使用者資訊: ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setColor(member.displayHexColor || '#0099ff')
            .addFields(
                { name: '加入伺服器時間', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '帳號創建時間', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '身分組', value: member.roles.cache.map(r => r).join(' ').replace('@everyone', '') || '無', inline: false },
                { name: 'ID', value: target.id, inline: true }
            )
            .setFooter({ text: `查詢者: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
