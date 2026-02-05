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

            // 2. Auto-Moderation (Phase 2)
            const settings = db.prepare('SELECT automod_links, automod_badwords FROM settings WHERE guild_id = ?').get(message.guild.id);

            if (settings) {
                // A. Link Blocker
                if (settings.automod_links === 1) {
                    const linkRegex = /(https?:\/\/[^\s]+)/g;
                    if (linkRegex.test(message.content)) {
                        // Check if user is admin (bypass)
                        if (!message.member.permissions.has('Administrator')) {
                            await message.delete().catch(() => { });
                            const warning = await message.channel.send(`${message.author}, ⚠️ 本伺服器禁止發送連結！ (No Links Allowed)`);
                            setTimeout(() => warning.delete().catch(() => { }), 5000);
                            return;
                        }
                    }
                }

                // B. Bad Words Filter
                if (settings.automod_badwords) {
                    const badWords = settings.automod_badwords.split(',').map(w => w.trim()).filter(w => w.length > 0);
                    const content = message.content.toLowerCase();
                    const found = badWords.some(word => content.includes(word.toLowerCase()));

                    if (found) {
                        if (!message.member.permissions.has('Administrator')) {
                            await message.delete().catch(() => { });
                            const warning = await message.channel.send(`${message.author}, ⚠️ 請注意您的用詞！ (Bad Word Detected)`);
                            setTimeout(() => warning.delete().catch(() => { }), 5000);
                            return;
                        }
                    }
                }
            }

            // 3. Future: Leveling System (Phase 3)

        } catch (error) {
            logger.error(`Message Create Error: ${error.message}`);
        }
    },
};
