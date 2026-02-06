const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('創建領取身分組訊息 (Create Role Claim Message)')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('要領取的身分組 | Role to claim')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('訊息描述 | Message Description')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const description = interaction.options.getString('description') || `點擊下方按鈕以領取 ${role.name} 身分組！`;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ 身分組領取 (Role Claim)')
            .setDescription(description)
            .setColor(role.color || '#5865F2')
            .setFooter({ text: 'VX6 Role System' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`claim_role_${role.id}`)
                    .setLabel(`領取 ${role.name}`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✨')
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
