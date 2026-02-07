const { Events } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');
const mongo = require('../../database/mongo');
const logger = require('../../core/logger');
const AiService = require('../services/aiService');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        try {
            // AI Chat (Priority if Mentioned)
            if (message.mentions.has(message.client.user) && !message.mentions.everyone && mongo.getIsConnected()) {
                const settings = await GuildSettings.findOne({ guildId: message.guild.id });

                if (settings?.ai?.enabled) {
                    if (settings.ai.channelId && settings.ai.channelId !== message.channel.id) {
                        return;
                    }

                    await message.channel.sendTyping();
                    const prompt = message.content.replace(/<@!?[0-9]+>/g, '').trim();
                    if (!prompt) return; // Ignore empty mentions

                    const response = await AiService.generateResponse(prompt, `
User: ${message.author.username}
Server: ${message.guild.name}
Role: Helpful Discord Bot
                    `.trim());

                    await message.reply(response);
                    return;
                }
            }
        } catch (error) {
            logger.error(`Message Create Error: ${error.message}`);
        }
    },
};
