const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/db');
const logger = require('../../core/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // User Joined a Channel
        if (newState.channelId && newState.channelId !== oldState.channelId) {
            const voiceConfig = db.prepare('SELECT * FROM voice_master WHERE channel_id = ?').get(newState.channelId);

            // User joined the "Join to Create" channel
            if (voiceConfig) {
                try {
                    const guild = newState.guild;
                    const member = newState.member;
                    const parent = guild.channels.cache.get(voiceConfig.category_id);

                    // Create Private Channel
                    const channelName = `${member.user.username}'s Room`;
                    const newChannel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildVoice,
                        parent: parent ? parent.id : null,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                            },
                            {
                                id: member.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
                            },
                        ],
                    });

                    // Move member to new channel
                    await member.voice.setChannel(newChannel);

                    // Register in DB
                    db.prepare('INSERT INTO voice_channels (channel_id, guild_id, owner_id) VALUES (?, ?, ?)').run(newChannel.id, guild.id, member.id);

                    // Optional: Send Interface/Help Message in text channel (if exists) or DM? 
                    // Voice channels now have text chat. Let's send a guide there.
                    // Wait for channel creation to settle
                    setTimeout(async () => {
                        try {
                            const inviteEmbed = {
                                title: '🔊 VoiceMaster 控制台',
                                description: '使用 `/voice` 指令來管理你的頻道！\n\n🔒 `/voice lock` 鎖定\n👻 `/voice hide` 隱藏\n✏️ `/voice name` 改名\n🦶 `/voice kick` 踢人',
                                color: 0x5865F2
                            };
                            await newChannel.send({ embeds: [inviteEmbed] });
                        } catch (e) {
                            // Ignore if cannot send message
                        }
                    }, 1000);

                } catch (error) {
                    logger.error(`VoiceMaster Error: ${error.message}`);
                }
            }
        }

        // User Left a Channel
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            const channelRecord = db.prepare('SELECT * FROM voice_channels WHERE channel_id = ?').get(oldState.channelId);

            if (channelRecord) {
                const channel = oldState.guild.channels.cache.get(oldState.channelId);

                // Check if empty
                if (channel && channel.members.size === 0) {
                    try {
                        await channel.delete();
                        db.prepare('DELETE FROM voice_channels WHERE channel_id = ?').run(oldState.channelId);
                    } catch (error) {
                        logger.error(`Failed to delete temp voice channel: ${error.message}`);
                    }
                }
            }
        }
    },
};
