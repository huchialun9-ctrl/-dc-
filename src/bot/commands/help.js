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
            .setDescription('這裡列出了所有可用的指令。使用 `/指令名` 來執行。\n或是前往 [控制台](https://dc-production-b215.up.railway.app/dashboard) 查看更多設定。')
            .setColor('#5865F2')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({
                text: `正在服務 ${guildCount} 個伺服器 | ${userCount} 位使用者`,
                iconURL: 'https://cdn.discordapp.com/emojis/996000000000000000.png' // Optional: specialized icon or bot icon 
            });

        // Group commands? Or just list them.
        // For "App Directory" feel, maybe a list of "Code Blocks" or "Inline Fields"

        // Let's create a nice grid using Fields
        let descriptionField = "";

        commands.forEach(cmd => {
            // Use format: ` /command ` - description
            descriptionField += `**/${cmd.data.name}**\n${cmd.data.description}\n\n`;
        });

        // Split if too long (Discord limit 4096).
        // For now, assume it fits or simple truncation.

        embed.addFields({ name: '🛠️ 指令列表', value: descriptionField || '暫無指令' });

        // Add "Buttons" if possible? 
        // We can add a "Link Button" to dashboard.
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('前往控制台')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://dc-production-b215.up.railway.app/dashboard'),
                new ButtonBuilder()
                    .setLabel('邀請機器人')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
