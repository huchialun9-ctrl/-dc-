const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('💰 經濟系統 | Economy System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('查看錢包餘額 | Check balance')
                .addUserOption(option => option.setName('user').setDescription('查看其他人的餘額')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('領取每日獎勵 | Claim daily reward'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('查看富豪榜 | View leaderboard')),
    async execute(interaction) {
        const { guild, user, options } = interaction;
        const subcommand = options.getSubcommand();

        // Check if economy is enabled
        const settings = db.prepare('SELECT economy_enabled, economy_daily, economy_start_balance FROM settings WHERE guild_id = ?').get(guild.id);
        if (!settings || settings.economy_enabled !== 1) {
            return interaction.reply({ content: '❌ 此伺服器尚未啟用經濟系統！請管理員至Dashboard開啟。', ephemeral: true });
        }

        if (subcommand === 'balance') {
            const targetUser = options.getUser('user') || user;
            const data = db.prepare('SELECT balance FROM economy WHERE user_id = ? AND guild_id = ?').get(targetUser.id, guild.id);
            const balance = data ? data.balance : 0;

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('💰 錢包餘額 (Wallet)')
                .setDescription(`${targetUser} 目前擁有 **$${balance.toLocaleString()}**`)
                .setThumbnail(targetUser.displayAvatarURL());

            interaction.reply({ embeds: [embed] });
        }

        else if (subcommand === 'daily') {
            const data = db.prepare('SELECT * FROM economy WHERE user_id = ? AND guild_id = ?').get(user.id, guild.id);
            const now = Date.now();
            const lastDaily = data ? new Date(data.last_daily).getTime() : 0;
            const cooldown = 24 * 60 * 60 * 1000; // 24 Hours

            if (now - lastDaily < cooldown) {
                const remaining = cooldown - (now - lastDaily);
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                return interaction.reply({ content: `⏳ 您已經領過今天的獎勵了！請在 **${hours}小時 ${minutes}分** 後再來。`, ephemeral: true });
            }

            const dailyAmount = settings.economy_daily || 100;
            const startBalance = settings.economy_start_balance || 0;
            const reward = dailyAmount;

            if (data) {
                db.prepare('UPDATE economy SET balance = balance + ?, last_daily = ? WHERE user_id = ? AND guild_id = ?')
                    .run(reward, new Date().toISOString(), user.id, guild.id);
            } else {
                db.prepare('INSERT INTO economy (user_id, guild_id, balance, last_daily) VALUES (?, ?, ?, ?)')
                    .run(user.id, guild.id, startBalance + reward, new Date().toISOString());
            }

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ 每日獎勵 (Daily Reward)')
                .setDescription(`您領取了 **$${reward}**！\n現在餘額: **$${((data ? data.balance : 0) + reward).toLocaleString()}**`);

            interaction.reply({ embeds: [embed] });
        }

        else if (subcommand === 'leaderboard') {
            const topUsers = db.prepare('SELECT * FROM economy WHERE guild_id = ? ORDER BY balance DESC LIMIT 10').all(guild.id);

            if (topUsers.length === 0) {
                return interaction.reply('⚠️ 目前沒有人有錢！(No data yet)');
            }

            const description = topUsers.map((u, i) => {
                return `**#${i + 1}** <@${u.user_id}> - **$${u.balance.toLocaleString()}**`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#E6A23C')
                .setTitle(`🏆 ${guild.name} 富豪榜 (Top 10)`)
                .setDescription(description)
                .setFooter({ text: 'Economy System' });

            interaction.reply({ embeds: [embed] });
        }
    },
};
