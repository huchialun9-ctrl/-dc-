const { Events, ChannelType, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
        }

        // Handle Select Menu (Ticket Creation)
        else if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            const { values, guild, user } = interaction;
            const categoryType = values[0]; // tech, billing, report

            // Check if user already has a ticket using regex for flexibility
            const existingChannel = guild.channels.cache.find(c => c.name.startsWith(`${categoryType}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`));
            if (existingChannel) {
                return interaction.reply({ content: `You already have an open ticket: ${existingChannel}`, ephemeral: true });
            }

            // Find or Create Category
            let categoryName = 'Support Tickets';
            if (categoryType === 'tech') categoryName = 'Technical Support';
            if (categoryType === 'billing') categoryName = 'Billing Support';
            if (categoryType === 'report') categoryName = 'Reports';

            let category = guild.channels.cache.find(c => c.name === categoryName && c.type === ChannelType.GuildCategory);
            // Fallback for simplicity: Put all in one category or just create one common one for now if permissions allow
            // For stability, let's use a single "Zenith Tickets" category but different channel prefixes
            let mainCategory = guild.channels.cache.find(c => c.name === 'Zenith Tickets' && c.type === ChannelType.GuildCategory);
            if (!mainCategory) {
                mainCategory = await guild.channels.create({
                    name: 'Zenith Tickets',
                    type: ChannelType.GuildCategory,
                });
            }

            const channelName = `${categoryType}-${user.username}`;

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: mainCategory.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    }
                ],
            });

            const embed = new EmbedBuilder()
                .setTitle(`Ticket: ${categoryType.toUpperCase()} Issue`)
                .setDescription(`Hello ${user}, thank you for contacting support.\n\n**Category:** ${categoryType}\nOur team will be with you shortly.`)
                .setColor('#2ecc71')
                .setTimestamp();

            const closeBtn = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒');

            const row = new ActionRowBuilder().addComponents(closeBtn);

            await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
        }

        // Handle Close Button
        else if (interaction.isButton() && interaction.customId === 'close_ticket') {
            const { channel, user } = interaction;
            await interaction.deferReply();

            // Generate HTML Transcript
            const messages = await channel.messages.fetch({ limit: 100 });
            // Sort Messages by time
            const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            const { generateHTML } = require('../../utils/transcript');

            const htmlContent = generateHTML(sortedMessages, channel.name);
            const buffer = Buffer.from(htmlContent, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });

            // Send to User DM
            try {
                await user.send({ content: `Your ticket **${channel.name}** has been closed. Here is your transcript.`, files: [attachment] });
            } catch (err) {
                console.log(`Could not DM transcript to ${user.tag}`);
            }

            // Send to Log Channel (If configured - placeholder for now)
            // const logChannel = ...

            await channel.send({ content: 'Ticket closing in 5 seconds...', files: [attachment] });
            setTimeout(() => channel.delete(), 5000);
        }
    },
};
