const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('發送工單面板 | Send ticket panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Zenith Support Center')
            .setDescription('Please select the category that best matches your inquiry from the dropdown menu below.\n\n**Available Support:**\n🔧 **Technical Support** - Issues with the service\n💳 **Billing Support** - Subscriptions and payments\n🛡️ **Report User** - Policy violations')
            .setColor('#5865F2')
            .setImage('https://dummyimage.com/600x200/5865F2/ffffff&text=Zenith+Support') // Placeholder banner
            .setFooter({ text: 'Powered by ZenithBot V2' });

        const select = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Select a category...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Technical Support')
                    .setDescription('Get help with technical issues')
                    .setValue('tech')
                    .setEmoji('🔧'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Billing Support')
                    .setDescription('Subscription and payment help')
                    .setValue('billing')
                    .setEmoji('💳'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Report User')
                    .setDescription('Report a violation of our rules')
                    .setValue('report')
                    .setEmoji('🛡️'),
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
