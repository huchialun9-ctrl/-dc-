const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// A simple way to store config for this MVP without a database
const CONFIG_PATH = path.join(__dirname, '../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure the bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('transcripts')
                .setDescription('The channel to send ticket transcripts to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('transcripts');

        // Save to JSON
        let config = {};
        if (fs.existsSync(CONFIG_PATH)) {
            config = JSON.parse(fs.readFileSync(CONFIG_PATH));
        }

        config[interaction.guildId] = {
            logChannelId: channel.id
        };

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

        await interaction.reply({ content: `Configuration saved! Transcripts will be sent to ${channel}.`, ephemeral: true });
    },
};
