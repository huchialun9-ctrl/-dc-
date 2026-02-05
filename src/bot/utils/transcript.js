module.exports = {
    generateHTML: (messages, channelName) => {
        let conversationHTML = messages.map(msg => {
            const date = msg.createdAt.toLocaleString();
            const avatar = msg.author.displayAvatarURL({ forceStatic: true, size: 64 });
            const botTag = msg.author.bot ? '<span class="bot-badge">BOT</span>' : '';

            return `
            <div class="message">
                <img src="${avatar}" class="avatar">
                <div class="content">
                    <div class="meta">
                        <span class="username">${msg.author.username}</span>
                        ${botTag}
                        <span class="timestamp">${date}</span>
                    </div>
                    <div class="text">${msg.content}</div>
                </div>
            </div>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Transcript - ${channelName}</title>
    <style>
        body { background: #36393f; color: #dcddde; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
        .header { border-bottom: 1px solid #2f3136; padding-bottom: 20px; margin-bottom: 20px; }
        .message { display: flex; margin-bottom: 20px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 20px; }
        .meta { margin-bottom: 5px; }
        .username { font-weight: 500; color: #fff; margin-right: 5px; }
        .timestamp { font-size: 0.75rem; color: #72767d; }
        .bot-badge { background: #5865f2; color: #fff; font-size: 0.625rem; padding: 1px 4px; border-radius: 3px; vertical-align: middle; margin-right: 5px; }
        .text { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Transcript: ${channelName}</h1>
        <p>Exported ${new Date().toLocaleString()}</p>
    </div>
    <div class="chat-log">
        ${conversationHTML}
    </div>
</body>
</html>
        `;
    }
};
