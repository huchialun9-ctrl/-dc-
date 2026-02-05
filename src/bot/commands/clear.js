const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('批量刪除訊息 (僅限管理員)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('要刪除的訊息數量 (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)),
    async execute(interaction) {
        // Permission Check
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: '🚫 你沒有權限使用此指令 (需要管理訊息權限)!', ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount');

        await interaction.channel.bulkDelete(amount, true).catch(error => {
            console.error(error);
            return interaction.reply({ content: '❌ 刪除訊息時發生錯誤，可能是因為訊息太舊 (超過 14 天)。', ephemeral: true });
        });

        return interaction.reply({ content: `✅ 成功刪除 ${amount} 則訊息。`, ephemeral: true });
    },
};
