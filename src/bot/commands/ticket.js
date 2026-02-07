const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database/db');
const TicketService = require('../services/ticketService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('🎫 工單系統管理 | Ticket System Management')
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('🔧 發送工單開啟訊息 | Setup ticket message')
                .addChannelOption(opt => opt.setName('channel').setDescription('發送目標頻道').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('close')
                .setDescription('🔒 關閉當前工單 | Close current ticket')
                .addStringOption(opt => opt.setName('reason').setDescription('關閉原因'))
        )
        .addSubcommand(sub =>
            sub.setName('claim')
                .setDescription('🙋 領取當前工單 | Claim current ticket')
        )
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('➕ 新增成員至工單 | Add member to ticket')
                .addUserOption(opt => opt.setName('user').setDescription('目標成員').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('➖ 移除工單成員 | Remove member from ticket')
                .addUserOption(opt => opt.setName('user').setDescription('目標成員').setRequired(true))
        )
        .addSubcommandGroup(group =>
            group.setName('category')
                .setDescription('📁 管理工單分類 | Manage categories')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('➕ 新增分類 | Add category')
                        .addStringOption(opt => opt.setName('id').setDescription('唯一識別碼 (如 tech)').setRequired(true))
                        .addStringOption(opt => opt.setName('label').setDescription('顯示名稱').setRequired(true))
                        .addStringOption(opt => opt.setName('desc').setDescription('分類描述').setRequired(true))
                )
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('➖ 刪除分類 | Remove category')
                        .addStringOption(opt => opt.setName('id').setDescription('分類識別碼').setRequired(true))
                )
                .addSubcommand(sub =>
                    sub.setName('list')
                        .setDescription('📜 列出所有分類 | List categories')
                )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup();

        // 1. Setup
        if (sub === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '❌ 您需要管理員權限。', ephemeral: true });
            const channel = interaction.options.getChannel('channel');

            const settings = db.prepare('SELECT ticket_categories FROM settings WHERE guild_id = ?').get(interaction.guildId);
            let categories = [];
            if (settings && settings.ticket_categories) {
                try { categories = JSON.parse(settings.ticket_categories); } catch (e) { }
            }

            const embed = new EmbedBuilder()
                .setTitle('📩 聯絡客服支援 (Contact Support)')
                .setDescription('如果您需要幫助或有任何疑問，請在下方選單中選擇合適的分類來開啟工單。✨')
                .setColor('#5865F2')
                .setFooter({ text: 'VX6 Support System' });

            const options = categories.length > 0
                ? categories.map(c => ({ label: c.label, description: c.description, value: c.value }))
                : [
                    { label: '一般支援', description: '通用的問題諮詢', value: 'general' },
                    { label: '技術回報', description: '錯誤或技術問題報修', value: 'tech' },
                    { label: '檢舉投訴', description: '舉報違規行為', value: 'report' },
                    { label: '其他', description: '自定義敘述您的問題', value: 'other' }
                ];

            const select = new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('選擇一個分類...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(select);
            await channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: `✅ 已在 ${channel} 發送工單訊息。`, ephemeral: true });
        }

        // 2. Claim
        if (sub === 'claim') {
            const result = await TicketService.claimTicket(interaction.channel, interaction.user);
            if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
            return interaction.reply({ content: '✅ 您已領取此工單。', ephemeral: true });
        }

        // 3. Close
        if (sub === 'close') {
            if (!interaction.channel.name.startsWith('ticket-')) return interaction.reply({ content: '❌ 此指令只能在工單頻道內使用。', ephemeral: true });
            await interaction.reply('🔒 正在關閉工單...');
            await TicketService.closeTicket(interaction.channel, interaction.user);
            return;
        }

        // 4. Add/Remove Member
        if (sub === 'add' || sub === 'remove') {
            if (!interaction.channel.name.startsWith('ticket-')) return interaction.reply({ content: '❌ 此指令只能在工單頻道內使用。', ephemeral: true });
            const user = interaction.options.getUser('user');
            const action = sub === 'add' ? '新增' : '移除';

            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: sub === 'add',
                SendMessages: sub === 'add',
                AttachFiles: sub === 'add'
            });

            return interaction.reply({ content: `✅ 已將 ${user} 從此工單${action}。` });
        }

        // 5. Categories Management
        if (group === 'category') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '❌ 您需要管理員權限。', ephemeral: true });

            let settings = db.prepare('SELECT ticket_categories FROM settings WHERE guild_id = ?').get(interaction.guildId);
            let categories = [];
            if (settings && settings.ticket_categories) {
                try { categories = JSON.parse(settings.ticket_categories); } catch (e) { }
            }

            if (sub === 'add') {
                const id = interaction.options.getString('id');
                const label = interaction.options.getString('label');
                const desc = interaction.options.getString('desc');

                categories = categories.filter(c => c.value !== id);
                categories.push({ value: id, label, description: desc });

                db.prepare(`
                    INSERT INTO settings (guild_id, ticket_categories, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(guild_id) DO UPDATE SET 
                    ticket_categories = excluded.ticket_categories, 
                    updated_at = CURRENT_TIMESTAMP
                `).run(interaction.guildId, JSON.stringify(categories));

                return interaction.reply({ content: `✅ 已新增分類：**${label}** (${id})`, ephemeral: true });
            }

            if (sub === 'remove') {
                const id = interaction.options.getString('id');
                const newCats = categories.filter(c => c.value !== id);

                db.prepare(`
                    INSERT INTO settings (guild_id, ticket_categories, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(guild_id) DO UPDATE SET 
                    ticket_categories = excluded.ticket_categories, 
                    updated_at = CURRENT_TIMESTAMP
                `).run(interaction.guildId, JSON.stringify(newCats));

                return interaction.reply({ content: `✅ 已移除分類：\`${id}\``, ephemeral: true });
            }

            if (sub === 'list') {
                const list = categories.map(c => `\u2022 \`${c.value}\`: **${c.label}** - ${c.description}`).join('\n') || '尚無分類。';
                const embed = new EmbedBuilder()
                    .setTitle('📁 工單分類列表')
                    .setDescription(list)
                    .setColor('#5865F2');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};
