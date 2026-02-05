const { Events } = require('discord.js');
const db = require('../../database/db');
const logger = require('../../core/logger');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        try {
            // 1. Check Custom Commands
            // Simple robust check: exact match or starts with (if needed, but simple trigger usually implies exact or prefix)
            // For now, let's do "exact match" to be safe and simple 
            // OR checks if message content STARTS with the trigger

            const commands = db.prepare('SELECT trigger, response FROM custom_commands WHERE guild_id = ?').all(message.guild.id);

            for (const cmd of commands) {
                if (message.content === cmd.trigger) {
                    await message.reply(cmd.response);
                    return; // Stop processing after finding a match
                }
            }

            // 2. Future: Leveling System (Phase 3)
            // 3. Future: Auto-Mod (Phase 2)

        } catch (error) {
            logger.error(`Message Create Error: ${error.message}`);
        }
    },
};
