const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('顯示所有指令列表與機器人資訊 (Show all commands)'),

    async execute(interaction) {
        const { commands } = interaction.client;
        const guildCount = interaction.client.guilds.cache.size;
        const userCount = interaction.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

        const embed = new EmbedBuilder()
            .setTitle('🤖 VX6 機器人指令清單')
            .setDescription('這裡列出了所有可用的指令。使用 `/指令名` 來執行。\n管理員可以使用 `/config` 進行伺服器配置。')
            .setColor('#5865F2')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({
                text: `正在服務 ${guildCount} 個伺服器 | ${userCount} 位使用者`,
                iconURL: 'https://cdn.discordapp.com/emojis/996000000000000000.png'
            });

        // Group commands
        let descriptionField = "";

        commands.forEach(cmd => {
            descriptionField += `**/${cmd.data.name}**\n${cmd.data.description}\n\n`;
        });

        embed.addFields({ name: '🛠️ 指令列表', value: descriptionField || '暫無指令' });

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('查看文檔')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://dc-production-b215.up.railway.app/'),
                new ButtonBuilder()
                    .setLabel('邀請機器人')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
