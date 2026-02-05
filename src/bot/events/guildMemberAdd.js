const { Events, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const logger = require('../../core/logger');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Fetch Welcome Settings
            const settings = db.prepare('SELECT welcome_channel_id, welcome_message, welcome_enabled FROM settings WHERE guild_id = ?').get(member.guild.id);

            // If not enabled or no channel set, return
            if (!settings || !settings.welcome_enabled || !settings.welcome_channel_id) return;

            const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
            if (!channel) return;

            // Generate Message (Replace Placeholders)
            let messageContent = settings.welcome_message || 'Welcome {user} to {server}!';
            messageContent = messageContent
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{server}/g, member.guild.name)
                .replace(/{memberCount}/g, member.guild.memberCount);

            // Send as simple message or Embed? 
            // Let's use a nice Embed for Enterprise feel
            const embed = new EmbedBuilder()
                .setTitle(`New Member Joined!`)
                .setDescription(messageContent)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setColor('#00ff9d')
                .setTimestamp()
                .setFooter({ text: `Member #${member.guild.memberCount}` });

            await channel.send({ content: `Welcome <@${member.id}>!`, embeds: [embed] });

        } catch (error) {
            logger.error(`Welcome Event Error: ${error.message}`);
        }
    },
};
