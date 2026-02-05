const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('顯示伺服器詳細資訊 | Display server information'),
    async execute(interaction) {
        const guild = interaction.guild;

        // Ensure accurate member counts
        const memberCount = guild.memberCount;
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const rolesCount = guild.roles.cache.size;

        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} 伺服器資訊`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .setColor('#f1c40f')
            .addFields(
                { name: '擁有者', value: `<@${guild.ownerId}>`, inline: true },
                { name: '成員數', value: `${memberCount} 人`, inline: true },
                { name: '建立日期', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: '頻道統計', value: `💬 文字: ${textChannels}\n🔊 語音: ${voiceChannels}`, inline: true },
                { name: '身分組數量', value: `${rolesCount} 個`, inline: true },
                { name: '伺服器 ID', value: guild.id, inline: true }
            )
            .setFooter({ text: `VX6 System | 此指令由 ${interaction.user.tag} 呼叫` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
