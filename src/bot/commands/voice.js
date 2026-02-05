const { SlashCommandBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('🔊 VoiceMaster 動態語音系統管理 | Manage dynamic voice channels')
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('🔧 設定新的 VoiceMaster 系統 (僅管理員) | Setup VoiceMaster (Admin only)')
                .addChannelOption(opt =>
                    opt.setName('category')
                        .setDescription('新語音頻道的分類 | Category for new channels')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('lock')
                .setDescription('🔒 鎖定頻道 (其他人無法加入) | Lock channel')
        )
        .addSubcommand(sub =>
            sub.setName('unlock')
                .setDescription('🔓 解鎖頻道 | Unlock channel')
        )
        .addSubcommand(sub =>
            sub.setName('hide')
                .setDescription('👻 隱藏頻道 (其他人看不到) | Hide channel')
        )
        .addSubcommand(sub =>
            sub.setName('unhide')
                .setDescription('👁️ 顯示頻道 | Unhide channel')
        )
        .addSubcommand(sub =>
            sub.setName('name')
                .setDescription('✏️ 修改頻道名稱 | Rename channel')
                .addStringOption(opt => opt.setName('new_name').setDescription('新名稱 | New name').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('kick')
                .setDescription('🦶 踢出成員 | Kick member')
                .addUserOption(opt => opt.setName('target').setDescription('目標成員 | Target member').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('permit')
                .setDescription('✅ 允許成員加入 (即使鎖定/隱藏) | Permit member')
                .addUserOption(opt => opt.setName('target').setDescription('目標成員 | Target member').setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // Admin Setup
        if (sub === 'setup') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '🚫 只有管理員可以使用此指令！', ephemeral: true });
            }

            const category = interaction.options.getChannel('category');

            // Create the "Join to Create" channel
            const hubChannel = await interaction.guild.channels.create({
                name: '➕ 點擊創建語音',
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [{
                    id: interaction.guild.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                }]
            });

            // Save to DB
            db.prepare(`
                INSERT INTO voice_master (guild_id, category_id, channel_id)
                VALUES (?, ?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                category_id = excluded.category_id,
                channel_id = excluded.channel_id
            `).run(guildId, category.id, hubChannel.id);

            return interaction.reply({ content: `✅ VoiceMaster 系統已設定完畢！\n請參閱: ${hubChannel}`, ephemeral: true });
        }

        // Voice Management Commands
        const memberChannel = interaction.member.voice.channel;
        if (!memberChannel) {
            return interaction.reply({ content: '❌ 你必須在語音頻道內才能使用此指令！', ephemeral: true });
        }

        // Check ownership
        const channelData = db.prepare('SELECT * FROM voice_channels WHERE channel_id = ?').get(memberChannel.id);
        if (!channelData || channelData.owner_id !== interaction.user.id) {
            return interaction.reply({ content: '❌ 這不是你的專屬頻道，或此頻道不是由 VoiceMaster 創建的。', ephemeral: true });
        }

        if (sub === 'lock') {
            await memberChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
            db.prepare('UPDATE voice_channels SET is_locked = 1 WHERE channel_id = ?').run(memberChannel.id);
            return interaction.reply({ content: '🔒 頻道已鎖定！', ephemeral: true });
        }

        if (sub === 'unlock') {
            await memberChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
            db.prepare('UPDATE voice_channels SET is_locked = 0 WHERE channel_id = ?').run(memberChannel.id);
            return interaction.reply({ content: '🔓 頻道已解鎖！', ephemeral: true });
        }

        if (sub === 'hide') {
            await memberChannel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
            db.prepare('UPDATE voice_channels SET is_hidden = 1 WHERE channel_id = ?').run(memberChannel.id);
            return interaction.reply({ content: '👻 頻道已隱藏！', ephemeral: true });
        }

        if (sub === 'unhide') {
            await memberChannel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: null });
            db.prepare('UPDATE voice_channels SET is_hidden = 0 WHERE channel_id = ?').run(memberChannel.id);
            return interaction.reply({ content: '👁️ 頻道已顯示！', ephemeral: true });
        }

        if (sub === 'name') {
            const newName = interaction.options.getString('new_name');
            await memberChannel.setName(newName);
            return interaction.reply({ content: `✏️ 頻道名稱已更改為: **${newName}**`, ephemeral: true });
        }

        if (sub === 'kick') {
            const target = interaction.options.getMember('target');
            if (target.id === interaction.user.id) return interaction.reply({ content: '❌ 你不能踢出你自己！', ephemeral: true });

            if (target.voice.channelId === memberChannel.id) {
                await target.voice.disconnect();
                return interaction.reply({ content: `🦶 已將 ${target} 踢出頻道！`, ephemeral: true });
            } else {
                return interaction.reply({ content: '❌ 該成員不在你的頻道內。', ephemeral: true });
            }
        }

        if (sub === 'permit') {
            const target = interaction.options.getMember('target');
            await memberChannel.permissionOverwrites.edit(target.id, { ViewChannel: true, Connect: true });
            return interaction.reply({ content: `✅ 已允許 ${target} 加入頻道！`, ephemeral: true });
        }
    },
};
