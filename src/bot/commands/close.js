const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Force closes the current ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        if (!interaction.channel.name.includes('-')) {
            return interaction.reply({ content: 'This does not look like a ticket channel.', ephemeral: true });
        }

        await interaction.reply('Closing this ticket via Admin Command...');

        // Find the user if possible to DM them (optional enhancement, kept simple for now)
        // Trigger the same close logic visually (reuse button ID would be harder here without refactor, 
        // so we manually duplicate delete logic for now or trigger 'close_ticket' logic if we extracted it)

        // Simple deletion for V2 MVP
        setTimeout(() => interaction.channel.delete().catch(console.error), 3000);
    },
};
