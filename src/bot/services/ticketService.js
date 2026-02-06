const { ChannelType, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../../database/db');
const logger = require('../../core/logger');
const { generateHTML } = require('../utils/transcript');

class TicketService {
    static async createTicket(guild, user, categoryType) {
        try {
            // Check DB for existing open ticket
            const existingTicket = db.prepare("SELECT * FROM tickets WHERE user_id = ? AND status = 'open' AND guild_id = ?").get(user.id, guild.id);
            if (existingTicket) {
                const channel = guild.channels.cache.get(existingTicket.channel_id);
                if (channel) return { error: `您已有開啟中的工單：${channel}` };
                db.prepare("UPDATE tickets SET status = 'closed' WHERE id = ?").run(existingTicket.id);
            }

            // Load Settings
            const settings = db.prepare('SELECT ticket_categories, ticket_support_role_id FROM settings WHERE guild_id = ?').get(guild.id);
            let categories = [];
            if (settings && settings.ticket_categories) {
                try { categories = JSON.parse(settings.ticket_categories); } catch (e) { }
            }

            // Determine Category
            const customCat = categories.find(c => c.value === categoryType);
            const formattedCategory = customCat ? customCat.label : (categoryType || '一般支援');

            // Permissions
            const permissionOverwrites = [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                { id: guild.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ];

            if (settings && settings.ticket_support_role_id) {
                permissionOverwrites.push({
                    id: settings.ticket_support_role_id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles]
                });
            }

            // Find/Create Category Parent
            let parentCategory = guild.channels.cache.find(c => c.name === 'VX6 Tickets' && c.type === ChannelType.GuildCategory);
            if (!parentCategory) {
                parentCategory = await guild.channels.create({ name: 'VX6 Tickets', type: ChannelType.GuildCategory });
            }

            const channelName = `ticket-${formattedCategory}-${user.username}`.toLowerCase().substring(0, 32).replace(/[^a-z0-9]/g, '-');

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: parentCategory.id,
                permissionOverwrites
            });

            // Persist to DB
            db.prepare("INSERT INTO tickets (channel_id, guild_id, user_id, category, status) VALUES (?, ?, ?, ?, 'open')")
                .run(ticketChannel.id, guild.id, user.id, categoryType);

            // Send Welcome Message
            const embed = new EmbedBuilder()
                .setTitle(`🎫 工單：${formattedCategory}`)
                .setDescription(`您好 ${user}，感謝您的聯繫。工作人員會儘快為您服務。\n\n**類別:** ${formattedCategory}`)
                .setColor('#5865F2')
                .setTimestamp();

            const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('關閉工單').setStyle(ButtonStyle.Danger).setEmoji('🔒');
            const claimBtn = new ButtonBuilder().setCustomId('claim_ticket').setLabel('領取工單').setStyle(ButtonStyle.Success).setEmoji('🙋');

            const row = new ActionRowBuilder().addComponents(claimBtn, closeBtn);
            await ticketChannel.send({ content: `${user} ${settings?.ticket_support_role_id ? `<@&${settings.ticket_support_role_id}>` : ''}`, embeds: [embed], components: [row] });

            return { channel: ticketChannel };
        } catch (error) {
            logger.error(`Create Ticket Error: ${error.message}`);
            throw error;
        }
    }

    static async claimTicket(channel, staffUser) {
        try {
            const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
            if (!ticket) return { error: '找不到工單紀錄。' };
            if (ticket.staff_id) return { error: '此工單已被領取。' };

            db.prepare("UPDATE tickets SET staff_id = ? WHERE channel_id = ?").run(staffUser.id, channel.id);

            // Update Permissions for explicit access
            await channel.permissionOverwrites.edit(staffUser.id, {
                ViewChannel: true,
                SendMessages: true,
                AttachFiles: true,
                ManageChannels: true
            });

            const embed = new EmbedBuilder()
                .setTitle('🙋 工單已領取')
                .setDescription(`此工單現在由 ${staffUser} 負責處理。`)
                .setColor('#10B981')
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            return { success: true };
        } catch (error) {
            logger.error(`Claim Ticket Error: ${error.message}`);
            throw error;
        }
    }

    static async closeTicket(channel, user) {
        try {
            const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
            db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(channel.id);

            // Transcript
            const messages = await channel.messages.fetch({ limit: 100 });
            const htmlContent = generateHTML(messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp), channel.name);
            const attachment = new AttachmentBuilder(Buffer.from(htmlContent, 'utf-8'), { name: `transcript-${channel.name}.html` });

            // Save Transcript
            try {
                db.prepare("INSERT INTO ticket_transcripts (channel_name, guild_id, user_id, html_content) VALUES (?, ?, ?, ?)").run(channel.name, channel.guild.id, ticket?.user_id || 'unknown', htmlContent);
            } catch (e) { logger.error(e); }

            // Log Channel
            const settings = db.prepare("SELECT log_channel_id FROM settings WHERE guild_id = ?").get(channel.guild.id);
            if (settings?.log_channel_id) {
                const logChan = channel.guild.channels.cache.get(settings.log_channel_id);
                if (logChan) await logChan.send({ content: `工單 **${channel.name}** 已關閉。執行者：${user.tag}`, files: [attachment] });
            }

            await channel.send({ content: '工單將在 5 秒後關閉...', files: [attachment] });
            setTimeout(() => channel.delete().catch(() => { }), 5000);
        } catch (error) {
            logger.error(`Close Ticket Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = TicketService;
