const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const GiveawayService = require('../services/giveawayService');

// Singleton instance managed in main bot file, but for command context...
// Ideally, the service should be attached to the client. 
// For now, we will assume we can access it or re-instantiate for simple DB ops, 
// BUT timer loop needs to be global. 
// Refactor Strategy: We will Init GiveawayService in index.js and attach to client.giveawayService

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('🎁 管理抽獎活動 | Manage giveaways')
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('開始一個新抽獎 | Start a new giveaway')
                .addStringOption(opt => opt.setName('prize').setDescription('獎品內容 | Prize').setRequired(true))
                .addStringOption(opt => opt.setName('duration').setDescription('持續時間 (例如: 10m, 1h, 2d) | Duration').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('獲獎人數 | Number of winners').setMinValue(1).setMaxValue(50))
        )
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('強制結束抽獎 | Force end a giveaway')
                .addStringOption(opt => opt.setName('message_id').setDescription('抽獎訊息 ID | Message ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('重新抽選獲獎者 | Reroll a winner')
                .addStringOption(opt => opt.setName('message_id').setDescription('抽獎訊息 ID | Message ID').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const giveawayService = interaction.client.giveawayService;

        if (sub === 'start') {
            const prize = interaction.options.getString('prize');
            const durationStr = interaction.options.getString('duration');
            const winners = interaction.options.getInteger('winners') || 1;

            // Parse Duration
            let timeMs = 0;
            const match = durationStr.match(/^(\d+)([smhd])$/);
            if (!match) return interaction.reply({ content: '❌ 時間格式錯誤！請使用數字+單位 (例如: 30s, 10m, 2h, 1d)', ephemeral: true });

            const [_, val, unit] = match;
            const amount = parseInt(val);
            if (unit === 's') timeMs = amount * 1000;
            else if (unit === 'm') timeMs = amount * 60 * 1000;
            else if (unit === 'h') timeMs = amount * 60 * 60 * 1000;
            else if (unit === 'd') timeMs = amount * 24 * 60 * 60 * 1000;

            await giveawayService.startGiveaway(interaction, prize, timeMs, winners);
        }

        else if (sub === 'end') {
            const messageId = interaction.options.getString('message_id');
            // Since endGiveaway in service relies on fetching from DB via ID or we trigger check.
            // We need a method to end by message ID directly.
            // The service checkGiveaways() ends by ID. Let's find the ID first.
            const db = require('../../database/db');
            const giveaway = db.prepare('SELECT id FROM giveaways WHERE message_id = ? AND ended = 0').get(messageId);

            if (!giveaway) {
                return interaction.reply({ content: '❌ 找不到該進行中的抽獎。', ephemeral: true });
            }

            await interaction.reply({ content: '⏳ 正強制結束抽獎...', ephemeral: true });
            await giveawayService.endGiveaway(giveaway.id);
        }

        else if (sub === 'reroll') {
            const messageId = interaction.options.getString('message_id');
            try {
                await giveawayService.reroll(interaction, messageId);
                if (!interaction.replied) await interaction.reply({ content: '✅ 已執行重新抽獎。', ephemeral: true });
            } catch (error) {
                await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
            }
        }
    },
};
