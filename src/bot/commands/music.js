const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('🎵 音樂播放系統 | Music System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('播放音樂 | Play a song')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('歌曲名稱或連結 | Song name or URL')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('停止播放並離開 | Stop and leave'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('skip')
                .setDescription('跳過當前歌曲 | Skip current song'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('顯示播放清單 | Show queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('volume')
                .setDescription('調整音量 | Set volume')
                .addIntegerOption(option =>
                    option.setName('percent')
                        .setDescription('音量百分比 (0-100)')
                        .setRequired(true))),
    async execute(interaction) {
        const { options, member, guild, channel } = interaction;
        const subcommand = options.getSubcommand();
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: '❌ 請先加入語音頻道！', ephemeral: true });
        }

        // Fetch settings if needed (volume, etc)
        const settings = require('../../database/db').prepare('SELECT * FROM settings WHERE guild_id = ?').get(guild.id);

        const distube = interaction.client.distube;

        try {
            if (subcommand === 'play') {
                const query = options.getString('query');
                await interaction.reply({ content: `🔍 正在搜尋: \`${query}\`...`, ephemeral: true });

                const queue = distube.play(voiceChannel, query, {
                    member: member,
                    textChannel: channel
                });

                // Apply default volume from settings
                if (settings && settings.music_volume !== undefined) {
                    setTimeout(() => {
                        const activeQueue = distube.getQueue(guild);
                        if (activeQueue) activeQueue.setVolume(settings.music_volume);
                    }, 2000); // Small delay to ensure queue is created
                }
            }

            else if (subcommand === 'stop') {
                const queue = distube.getQueue(guild);
                if (!queue) return interaction.reply({ content: '❌ 目前沒有在播放音樂。', ephemeral: true });
                distube.stop(guild);
                interaction.reply('⏹️ 已停止播放。');
            }

            else if (subcommand === 'skip') {
                const queue = distube.getQueue(guild);
                if (!queue) return interaction.reply({ content: '❌ 目前沒有在播放音樂。', ephemeral: true });
                try {
                    await queue.skip();
                    interaction.reply('⏭️ 已跳過歌曲。');
                } catch (e) {
                    interaction.reply({ content: '❌ 無法跳過 (可能是最後一首)。', ephemeral: true });
                }
            }

            else if (subcommand === 'queue') {
                const queue = distube.getQueue(guild);
                if (!queue) return interaction.reply({ content: '❌ 目前沒有播放清單。', ephemeral: true });

                const q = queue.songs
                    .map((song, i) => `${i === 0 ? 'Playing:' : `${i}.`} ${song.name} - \`${song.formattedDuration}\``)
                    .join('\n');

                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🎶 Current Queue')
                            .setDescription(q.slice(0, 4096))
                            .setColor('#F47FFF')
                    ]
                });
            }

            else if (subcommand === 'volume') {
                const percent = options.getInteger('percent');
                const queue = distube.getQueue(guild);
                if (!queue) return interaction.reply({ content: '❌ 目前沒有在播放音樂。', ephemeral: true });

                distube.setVolume(guild, percent);
                interaction.reply(`🔊 音量已設定為 ${percent}%`);
            }

        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                interaction.reply({ content: '❌ 發生錯誤。', ephemeral: true }).catch(() => { });
            }
        }
    },
};
