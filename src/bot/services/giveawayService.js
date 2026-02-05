const { EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const logger = require('../../core/logger');

class GiveawayService {
    constructor(client) {
        this.client = client;
    }

    // Start checking for ended giveaways
    init() {
        setInterval(() => this.checkGiveaways(), 5000); // Check every 5 seconds
    }

    async startGiveaway(interaction, prize, duration, winnersCount) {
        const endTime = Date.now() + duration;

        const embed = new EmbedBuilder()
            .setTitle('🎉 抽獎活動開始！')
            .setDescription(`**獎品**: ${prize}\n\n🏆 **名額**: ${winnersCount} 人\n⏳ **結束時間**: <t:${Math.floor(endTime / 1000)}:R>\n\n👇 **點擊下方按鈕或反應 🎉 參加！**`)
            .setColor('#FF0055')
            .setFooter({ text: `主辦人: ${interaction.user.tag}` })
            .setTimestamp(endTime);

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('🎉');

        // Save to DB
        db.prepare(`
            INSERT INTO giveaways (message_id, channel_id, guild_id, prize, winners_count, end_time, hosted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(message.id, interaction.channelId, interaction.guildId, prize, winnersCount, endTime, interaction.user.id);

        return message;
    }

    async checkGiveaways() {
        const giveaways = db.prepare('SELECT * FROM giveaways WHERE ended = 0 AND end_time <= ?').all(Date.now());

        for (const giveaway of giveaways) {
            await this.endGiveaway(giveaway.id);
        }
    }

    async endGiveaway(giveawayId) {
        const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
        if (!giveaway || giveaway.ended) return;

        try {
            const guild = await this.client.guilds.fetch(giveaway.guild_id);
            const channel = await guild.channels.fetch(giveaway.channel_id);
            const message = await channel.messages.fetch(giveaway.message_id);

            const invalidReaction = message.reactions.cache.get('🎉');
            if (!invalidReaction) {
                // Should not happen unless reaction removed
                this.closeGiveawayInDb(giveawayId);
                return;
            }

            const users = await invalidReaction.users.fetch();
            const eligibleUsers = users.filter(u => !u.bot);

            // Mark as ended in DB first to prevent double ending
            this.closeGiveawayInDb(giveawayId);

            if (eligibleUsers.size === 0) {
                await message.reply('😢 這次抽獎因為沒有有效參與者而取消了。');
                return;
            }

            // Pick winners
            const winners = eligibleUsers.random(Math.min(giveaway.winners_count, eligibleUsers.size));
            const winnersText = winners.map(w => `<@${w.id}>`).join(', ');

            const endEmbed = EmbedBuilder.from(message.embeds[0])
                .setTitle('🎊 抽獎活動已結束！')
                .setDescription(`**獎品**: ${giveaway.prize}\n\n🏆 **獲獎者**: ${winnersText}\n👤 **主辦人**: <@${giveaway.hosted_by}>`)
                .setColor('#2ecc71');

            await message.edit({ embeds: [endEmbed] });
            await message.reply(`恭喜 ${winnersText} 贏得了 **${giveaway.prize}**！ 🎉`);

        } catch (error) {
            logger.error(`Failed to end giveaway ${giveawayId}: ${error.message}`);
            // Still close it in DB to prevent loop, but maybe log it detailedly
            this.closeGiveawayInDb(giveawayId);
        }
    }

    async reroll(interaction, messageId) {
        const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND ended = 1').get(messageId);
        if (!giveaway) {
            throw new Error('找不到該抽獎或抽獎尚未結束。');
        }

        const channel = interaction.channel;
        const message = await channel.messages.fetch(messageId);
        const reaction = message.reactions.cache.get('🎉');
        const users = await reaction.users.fetch();
        const eligibleUsers = users.filter(u => !u.bot);

        if (eligibleUsers.size === 0) {
            throw new Error('沒有有效參與者，無法重新抽獎。');
        }

        const winner = eligibleUsers.random();
        await channel.send(`🎟️ **重新抽獎結果**: 恭喜 <@${winner.id}> 贏得了 **${giveaway.prize}**！`);
    }

    closeGiveawayInDb(id) {
        db.prepare('UPDATE giveaways SET ended = 1 WHERE id = ?').run(id);
    }
}

module.exports = GiveawayService;
