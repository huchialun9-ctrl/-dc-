const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('🔧 開啟網頁版儀表板設定 | Open web dashboard settings'),
    async execute(interaction) {
        // The domain should be configured in .env, defaulting to localhost if not set
        // In production, this must be the actual public URL
        let domain = process.env.DOMAIN;

        // Try to derive from REDIRECT_URI (e.g. https://myapp.railway.app/auth/discord/callback)
        if (!domain && process.env.REDIRECT_URI) {
            try {
                const url = new URL(process.env.REDIRECT_URI);
                domain = url.origin;
            } catch (e) {
                console.error('Invalid REDIRECT_URI:', process.env.REDIRECT_URI);
            }
        }

        if (!domain) domain = 'http://localhost:3000';

        const dashboardUrl = `${domain}/dashboard/settings?guild_id=${interaction.guild.id}`;

        const embed = new EmbedBuilder()
            .setTitle('🔧 儀表板設定 | Dashboard Settings')
            .setDescription('點擊下方按鈕前往網頁版儀表板，您可以設定：\n\n- 👋 **歡迎系統 (Welcome)**\n- 🎫 **工單系統 (Ticket)**\n- 🎭 **身分組領取 (Role Claim)**\n- 📣 **公告系統 (Announcements)**')
            .setColor('#5865F2');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('前往儀表板 | Open Dashboard')
                    .setStyle(ButtonStyle.Link)
                    .setURL(dashboardUrl)
                    .setEmoji('🔗')
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
