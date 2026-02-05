const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('earthquake')
        .setDescription('🌋 地震速報設定 | Earthquake Alert Settings')
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('✅ 訂閱地震通知到此頻道 | Subscribe to alerts')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('指定頻道 (留空則為當前頻道) | Channel')
                        .addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('❌ 取消訂閱 | Unsubscribe')
        )
        .addSubcommand(sub =>
            sub.setName('test')
                .setDescription('🧪 測試發送一則報告 (僅測試用) | Test alert')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // Check Permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: '🚫 只有管理員可以使用此指令！', ephemeral: true });
        }

        if (sub === 'setup') {
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            db.prepare(`
                INSERT INTO earthquake_subs (guild_id, channel_id)
                VALUES (?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                channel_id = excluded.channel_id
            `).run(guildId, channel.id);

            return interaction.reply({ content: `✅ 已將地震速報設定發送至 ${channel}！`, ephemeral: true });
        }

        if (sub === 'off') {
            const result = db.prepare('DELETE FROM earthquake_subs WHERE guild_id = ?').run(guildId);
            if (result.changes > 0) {
                return interaction.reply({ content: '✅ 已取消訂閱地震速報。', ephemeral: true });
            } else {
                return interaction.reply({ content: '❌ 此伺服器尚未訂閱。', ephemeral: true });
            }
        }

        if (sub === 'test') {
            if (!interaction.client.earthquakeService) {
                return interaction.reply({ content: '❌ 服務尚未初始化 (可能缺少 API Key)。', ephemeral: true });
            }

            await interaction.reply({ content: '🧪 正在抓取最新一筆地震資料作為測試...', ephemeral: true });

            // Force fetch latest report
            try {
                const axios = require('axios');
                const apiKey = process.env.CWA_API_KEY;
                if (!apiKey) return interaction.followUp({ content: '❌ 尚未設定 API Key 於 .env', ephemeral: true });

                const response = await axios.get('https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001', {
                    params: { Authorization: apiKey, format: 'JSON', limit: 1 }
                });

                const report = response.data.records.Earthquake[0];
                if (report) {
                    await interaction.client.earthquakeService.sendAlert(report);
                    await interaction.followUp({ content: '✅ 測試發送完畢！(請檢查訂閱頻道)', ephemeral: true });
                } else {
                    await interaction.followUp({ content: '⚠️ 找不到地震資料。', ephemeral: true });
                }
            } catch (e) {
                await interaction.followUp({ content: `❌ 測試失敗: ${e.message}`, ephemeral: true });
            }
        }
    },
};
