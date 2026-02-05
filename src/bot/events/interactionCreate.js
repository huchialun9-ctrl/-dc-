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
        } else if (interaction.isButton()) {
            const { customId, guild, user, channel } = interaction;

            if (customId === 'create_ticket') {
                // Check if user already has a ticket
                const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase().replace(/\s+/g, '-')}`);
                if (existingChannel) {
                    return interaction.reply({ content: `You already have an open ticket: ${existingChannel}`, ephemeral: true });
                }

                // Check or Create Category
                let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
                if (!category) {
                    category = await guild.channels.create({
                        name: 'Tickets',
                        type: ChannelType.GuildCategory,
                    });
                }

                // Create Ticket Channel
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}`,
                    type: ChannelType.GuildText,
                    parent: category.id,
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
                    .setTitle(`Ticket: ${user.username}`)
                    .setDescription('Support will be with you shortly. To close this ticket, react with 🔒\nOr click the button below.')
                    .setColor('#00ff00');

                const closeBtn = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒');

                const row = new ActionRowBuilder().addComponents(closeBtn);

                await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
                await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });

            } else if (customId === 'close_ticket') {
                await interaction.deferReply();

                // Generate Transcript (Basic Text Version)
                const messages = await channel.messages.fetch({ limit: 100 });
                let transcript = `Transcript for ${channel.name}\nGenerated at ${new Date().toISOString()}\n\n`;

                messages.reverse().forEach(msg => {
                    transcript += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content || '[Attachment/Embed]'}\n`;
                });

                const buffer = Buffer.from(transcript, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

                // Send Transcript to Log Channel (TODO: Configurable Log Channel)
                // For now, send to DM or User in the channel before deleting
                try {
                    await user.send({ content: `Here is the transcript for your ticket ${channel.name}`, files: [attachment] });
                } catch (err) {
                    // User probably has DMs closed
                    console.log(`Could not DM transcript to ${user.tag}`);
                }

                await channel.send({ content: 'Ticket closing in 5 seconds...' });
                setTimeout(() => channel.delete(), 5000);
            }
        }
    },
};
