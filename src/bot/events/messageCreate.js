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

            // 3. Leveling System (Phase 3)
            // Check if enabled (Cache this ideally!)
            const levelingSetting = db.prepare('SELECT leveling_enabled FROM settings WHERE guild_id = ?').get(message.guild.id);
            if (levelingSetting && levelingSetting.leveling_enabled === 1) {
                const userId = message.author.id;
                const guildId = message.guild.id;

                // Get User Level Data
                let userLevel = db.prepare('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?').get(userId, guildId);

                if (!userLevel) {
                    // Create if not exists
                    db.prepare('INSERT INTO levels (user_id, guild_id, xp, level, last_xp_time) VALUES (?, ?, 0, 0, 0)').run(userId, guildId);
                    userLevel = { xp: 0, level: 0, last_xp_time: 0 };
                }

                // Check Cooldown (1 minute)
                const now = Date.now();
                const lastXpTime = userLevel.last_xp_time || 0;

                if (now - lastXpTime > 60000) {
                    // Award XP (Random 15-25)
                    const xpGain = Math.floor(Math.random() * 11) + 15;
                    const newXp = userLevel.xp + xpGain;

                    // Calculate Level
                    // Formula: Level N requires approx 100 * N XP maybe? 
                    // Let's use simple: 5 * level^2 + 50 * level + 100
                    const nextLevelXp = 5 * Math.pow(userLevel.level, 2) + 50 * userLevel.level + 100;

                    let newLevel = userLevel.level;
                    if (newXp >= nextLevelXp) {
                        newLevel++;
                        // Level Up Message
                        message.channel.send(`🎉 恭喜 ${message.author} 升級到了 **Lv. ${newLevel}**！`).catch(() => { });
                    }

                    // Update DB
                    db.prepare('UPDATE levels SET xp = ?, level = ?, last_xp_time = ? WHERE user_id = ? AND guild_id = ?').run(newXp, newLevel, now, userId, guildId);
                }
            }

        } catch (error) {
            logger.error(`Message Create Error: ${error.message}`);
        }
    },
};
