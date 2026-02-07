const mongoose = require('mongoose');

const GuildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    ai: {
        enabled: { type: Boolean, default: true },
        channelId: String
    },
    language: { type: String, default: 'zh' },
    template: { type: String, default: '' },
    lastStructure: { type: Object }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('GuildSettings', GuildSettingsSchema);
