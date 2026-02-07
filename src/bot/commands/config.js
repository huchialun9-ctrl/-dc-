const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('⚙️ 伺服器進階配置中心 (Server Configuration)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // Subcommand: Announcement
        .addSubcommand(sub =>
            sub.setName('announcement')
                .setDescription('設定公告廣播頻道')
                .addChannelOption(opt => opt.setName('channel').setDescription('公告發布頻道').addChannelTypes(ChannelType.GuildText).setRequired(true))
        )
        // Subcommand: Welcome
        .addSubcommand(sub =>
            sub.setName('welcome')
                .setDescription('設定歡迎訊息與頻道')
                .addChannelOption(opt => opt.setName('channel').setDescription('歡迎訊息頻道').addChannelTypes(ChannelType.GuildText).setRequired(true))
                .addStringOption(opt => opt.setName('message').setDescription('歡迎訊息內容 (可用 {user} 與 {guild})'))
        )
        // Subcommand: Economy
        .addSubcommand(sub =>
            sub.setName('economy')
                .setDescription('配置數位金庫 (經濟系統)')
                .addStringOption(opt => opt.setName('status').setDescription('啟用狀態').addChoices({ name: '開啟', value: 'on' }, { name: '關閉', value: 'off' }))
                .addNumberOption(opt => opt.setName('rate').setDescription('每日簽到倍率 (例如: 1.0)'))
        )
        // Subcommand: AI
        .addSubcommand(sub =>
            sub.setName('ai')
                .setDescription('配置 AI 思考維度')
                .addChannelOption(opt => opt.setName('channel').setDescription('AI 專用頻道').addChannelTypes(ChannelType.GuildText))
                .addStringOption(opt => opt.setName('status').setDescription('啟用狀態').addChoices({ name: '開啟', value: 'on' }, { name: '關閉', value: 'off' }))
        )
        // Subcommand: Leveling
        .addSubcommand(sub =>
            sub.setName('leveling')
                .setDescription('配置榮耀勳章 (等級系統)')
                .addNumberOption(opt => opt.setName('rate').setDescription('全域經驗倍率 (例如: 1.5)'))
                .addStringOption(opt => opt.setName('status').setDescription('啟用狀態').addChoices({ name: '開啟', value: 'on' }, { name: '關閉', value: 'off' }))
        )
        // Subcommand Group: Ticket
        .addSubcommandGroup(group =>
            group.setName('ticket')
                .setDescription('🎫 工單系統進階設定 (Ticket System)')
                .addSubcommand(sub =>
                    sub.setName('staff')
                        .setDescription('👮 設定客服工作人員身分組 (Support Role)')
                        .addRoleOption(opt => opt.setName('role').setDescription('客服身分組').setRequired(true))
                )
                .addSubcommand(sub =>
                    sub.setName('logs')
                        .setDescription('📜 設定工單對話紀錄頻道 (Transcript Channel)')
                        .addChannelOption(opt => opt.setName('channel').setDescription('日誌頻道').addChannelTypes(ChannelType.GuildText).setRequired(true))
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTimestamp();

        if (subcommand === 'announcement') {
            const channel = interaction.options.getChannel('channel');
            db.prepare(`INSERT INTO settings (guild_id, announcement_channel_id, announcement_enabled, updated_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id) DO UPDATE SET announcement_channel_id = excluded.announcement_channel_id, announcement_enabled = 1, updated_at = CURRENT_TIMESTAMP`).run(guildId, channel.id);
            embed.setTitle('📢 公告設定已更新').setDescription(`公告頻道已設置為 ${channel}`);
        }

        else if (subcommand === 'welcome') {
            const channel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message');

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, welcome_channel_id, welcome_message, welcome_enabled, updated_at) 
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP) 
                ON CONFLICT(guild_id) DO UPDATE SET 
                welcome_channel_id = excluded.welcome_channel_id, 
                welcome_message = COALESCE(excluded.welcome_message, settings.welcome_message),
                welcome_enabled = 1,
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guildId, channel.id, message || null);
            embed.setTitle('✨ 歡迎設定已更新').setDescription(`頻道: ${channel}\n訊息: ${message || '維持原樣'}`);
        }

        else if (subcommand === 'economy') {
            const status = interaction.options.getString('status');
            const rate = interaction.options.getNumber('rate');
            const enabled = status === 'on' ? 1 : (status === 'off' ? 0 : null);

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, economy_enabled, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP) 
                ON CONFLICT(guild_id) DO UPDATE SET 
                economy_enabled = COALESCE(?, settings.economy_enabled),
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guildId, enabled, enabled);
            embed.setTitle('💰 經濟系統設定已更新').setDescription(`狀態: ${status || '未變動'}\n倍率: ${rate || '未變動'}`);
        }

        else if (subcommand === 'ai') {
            const channel = interaction.options.getChannel('channel');
            const status = interaction.options.getString('status');
            const enabled = status === 'on' ? 1 : (status === 'off' ? 0 : null);

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, ai_channel_id, ai_chat_enabled, updated_at) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
                ON CONFLICT(guild_id) DO UPDATE SET 
                ai_channel_id = COALESCE(excluded.ai_channel_id, settings.ai_channel_id),
                ai_chat_enabled = COALESCE(excluded.ai_chat_enabled, settings.ai_chat_enabled),
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guildId, channel ? channel.id : null, enabled);
            embed.setTitle('🧠 AI 配置已更新').setDescription(`狀態: ${status || '未變動'}\n頻道: ${channel || '未變動'}`);
        }

        else if (subcommand === 'leveling') {
            const rate = interaction.options.getNumber('rate');
            const status = interaction.options.getString('status');
            const enabled = status === 'on' ? 1 : (status === 'off' ? 0 : null);

            const stmt = db.prepare(`
                INSERT INTO settings (guild_id, leveling_rate, leveling_enabled, updated_at) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
                ON CONFLICT(guild_id) DO UPDATE SET 
                leveling_rate = COALESCE(excluded.leveling_rate, settings.leveling_rate),
                leveling_enabled = COALESCE(excluded.leveling_enabled, settings.leveling_enabled),
                updated_at = CURRENT_TIMESTAMP
            `);
            stmt.run(guildId, rate || null, enabled);
            embed.setTitle('🏆 等級系統設定已更新').setDescription(`狀態: ${status || '未變動'}\n倍率: ${rate || '未變動'}`);
        }

        // 6. Ticket Config
        else if (interaction.options.getSubcommandGroup() === 'ticket') {
            const sub = interaction.options.getSubcommand();
            if (sub === 'staff') {
                const role = interaction.options.getRole('role');
                db.prepare(`
                    INSERT INTO settings (guild_id, ticket_support_role_id, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(guild_id) DO UPDATE SET 
                    ticket_support_role_id = excluded.ticket_support_role_id, 
                    updated_at = CURRENT_TIMESTAMP
                `).run(interaction.guildId, role.id);
                embed.setTitle('👮 客服身分組已設定').setDescription(`現在只有持有 ${role} 身分組的人員可以查看與領取工單。`);
            }
            if (sub === 'logs') {
                const channel = interaction.options.getChannel('channel');
                db.prepare(`
                    INSERT INTO settings (guild_id, log_channel_id, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(guild_id) DO UPDATE SET 
                    log_channel_id = excluded.log_channel_id, 
                    updated_at = CURRENT_TIMESTAMP
                `).run(interaction.guildId, channel.id);
                embed.setTitle('📜 工單日誌頻道已設定').setDescription(`所有的工單對話紀錄 (Transcripts) 將發送至 ${channel}。`);
            }
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
