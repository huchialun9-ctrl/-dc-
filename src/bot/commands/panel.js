const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

const db = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('🎫 發送工單面板 | Send ticket panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { guild } = interaction;

        // Fetch Categories
        const settings = db.prepare('SELECT ticket_categories FROM settings WHERE guild_id = ?').get(guild.id);
        let categories = [];
        if (settings && settings.ticket_categories) {
            try { categories = JSON.parse(settings.ticket_categories); } catch (e) { }
        }

        const embed = new EmbedBuilder()
            .setTitle('客服中心 (Support Center)')
            .setDescription('請從下方選單選擇您需要的協助類別。\n(Select a category from the dropdown below)')
            .setColor('#5865F2')
            .setFooter({ text: 'Powered by ZenithBot V2' });

        const select = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('選擇類別 (Select Category)...');

        if (categories.length > 0) {
            // Use Custom Categories
            categories.forEach(cat => {
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(cat.label)
                        .setDescription(cat.description || 'Click to open ticket')
                        .setValue(cat.value)
                        .setEmoji(cat.emoji || '🎫')
                );
            });
        } else {
            // Use Defaults
            select.addOptions(
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
        }

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
