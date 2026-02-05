const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    client.distube
        .on('playSong', (queue, song) => {
            const embed = new EmbedBuilder()
                .setColor('#F47FFF')
                .setTitle('🎶 Now Playing')
                .setDescription(`[${song.name}](${song.url})`)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: 'Duration', value: song.formattedDuration, inline: true },
                    { name: 'Requested By', value: `${song.user}`, inline: true }
                );
            queue.textChannel.send({ embeds: [embed] });
        })
        .on('addSong', (queue, song) => {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Added to Queue')
                .setDescription(`[${song.name}](${song.url})`)
                .setFooter({ text: `Requested by ${song.user.tag}` });
            queue.textChannel.send({ embeds: [embed] });
        })
        .on('addList', (queue, playlist) => {
            queue.textChannel.send(
                `✅ Added playlist \`${playlist.name}\` (${playlist.songs.length} songs) to queue`
            );
        })
        .on('error', (channel, e) => {
            if (channel) channel.send(`❌ An error encountered: ${e.toString().slice(0, 1974)}`);
            else console.error(e);
        });
};
