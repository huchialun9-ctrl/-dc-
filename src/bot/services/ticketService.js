const { ChannelType, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../../database/db');
const logger = require('../../core/logger');
const { generateHTML } = require('../utils/transcript');

class TicketService {
    static async createTicket(guild, user, categoryType) {
        try {
            // Check DB for existing open ticket
            const existingTicket = db.prepare("SELECT * FROM tickets WHERE user_id = ? AND status = 'open'").get(user.id);
            if (existingTicket) {
                // Verify channel still exists
                const channel = guild.channels.cache.get(existingTicket.channel_id);
                if (channel) return { error: `You already have an open ticket: ${channel}` };

                // If channel gone, close db record
                db.prepare("UPDATE tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?").run(existingTicket.id);
            }

            // Category configuration
            let categoryName = 'Support Tickets';
            let formattedCategory = 'Support';
            switch (categoryType) {
                case 'tech': categoryName = 'Technical Support'; formattedCategory = 'Technical'; break;
                case 'billing': categoryName = 'Billing Support'; formattedCategory = 'Billing'; break;
                case 'report': categoryName = 'Reports'; formattedCategory = 'Report'; break;
            }

            // Find/Create Discord Category
            let parentCategory = guild.channels.cache.find(c => c.name === categoryName && c.type === ChannelType.GuildCategory);
            // Fallback
            if (!parentCategory) {
                parentCategory = guild.channels.cache.find(c => c.name === 'Zenith Tickets' && c.type === ChannelType.GuildCategory);
                if (!parentCategory) {
                    parentCategory = await guild.channels.create({ name: 'Zenith Tickets', type: ChannelType.GuildCategory });
                }
            }

            const channelName = `${categoryType}-${user.username}`;

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: parentCategory.id,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                    { id: guild.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            // Persist to DB
            const stmt = db.prepare("INSERT INTO tickets (channel_id, guild_id, user_id, category, status) VALUES (?, ?, ?, ?, 'open')");
            stmt.run(ticketChannel.id, guild.id, user.id, categoryType);

            // Log activity
            db.prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)").run(user.id, 'CREATE_TICKET', `Created ticket ${ticketChannel.id}`);

            // Send Initial Message
            const embed = new EmbedBuilder()
                .setTitle(`Ticket: ${formattedCategory} Issue`)
                .setDescription(`Hello ${user}, thank you for contacting support.\n\n**Category:** ${formattedCategory}\nOur team will be with you shortly.`)
                .setColor('#2ecc71')
                .setTimestamp();

            const closeBtn = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒');

            const row = new ActionRowBuilder().addComponents(closeBtn);
            await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });

            return { channel: ticketChannel };

        } catch (error) {
            logger.error(`Create Ticket Error: ${error.message}`);
            throw error;
        }
    }

    static async closeTicket(channel, user) {
        try {
            // Update DB
            db.prepare("UPDATE tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE channel_id = ?").run(channel.id);

            // Log activity
            db.prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)").run(user.id, 'CLOSE_TICKET', `Closed ticket ${channel.id}`);

            // Transcript
            const messages = await channel.messages.fetch({ limit: 100 });
            const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
            const htmlContent = generateHTML(sortedMessages, channel.name);
            const buffer = Buffer.from(htmlContent, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });

            // Send to User
            try {
                await user.send({ content: `Your ticket **${channel.name}** has been closed. Here is your transcript.`, files: [attachment] });
            } catch (e) { /* ignore */ }

            // Send to Log Channel
            const settings = db.prepare("SELECT log_channel_id FROM settings WHERE guild_id = ?").get(channel.guild.id);
            if (settings && settings.log_channel_id) {
                const logChannel = channel.guild.channels.cache.get(settings.log_channel_id);
                if (logChannel) {
                    await logChannel.send({ content: `Ticket closed by ${user.tag}`, files: [attachment] });
                }
            }

            await channel.send({ content: 'Ticket closing in 5 seconds...', files: [attachment] });
            setTimeout(() => channel.delete(), 5000);

        } catch (error) {
            logger.error(`Close Ticket Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = TicketService;
