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
            .setTitle('🤖 VX6 BOT 指令中心 (Command Hub)')
            .setDescription('這裡列出了所有可用的指令。您可以直接在頻道中使用 `/指令`。✨\n管理員請使用 `/config` 進行伺服器全域配置。')
            .setColor('#5865F2')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({
                text: `正在服務 ${guildCount} 個伺服器 | ${userCount} 位使用者`,
            });

        // Define Categories
        const categories = {
            admin: { name: '🛠️ 核心管理', commands: ['config', 'setup', 'setup-ai', 'admin', 'reactionrole'] },
            tools: { name: '🛡️ 工具與管理', commands: ['clear', 'close', 'say', 'voice', 'panel'] },
            fun: { name: '🎮 娛樂與互動', commands: ['economy', 'music', 'giveaway', 'dice', 'poll', 'earthquake'] },
            info: { name: 'ℹ️ 資訊與回饋', commands: ['help', 'ping', 'serverinfo', 'userinfo', 'avatar', 'donate'] }
        };

        // Populate Fields
        for (const key in categories) {
            const cat = categories[key];
            let fieldContent = "";

            cat.commands.forEach(cmdName => {
                const cmd = commands.get(cmdName);
                if (cmd) {
                    fieldContent += `\u2022 \`/${cmd.data.name}\` - ${cmd.data.description}\n`;
                }
            });

            if (fieldContent) {
                embed.addFields({ name: cat.name, value: fieldContent });
            }
        }

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
