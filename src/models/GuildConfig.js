const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    guildName: String,
    ownerId: String,
    structures: [{
        description: String,
        jsonStructure: Object, // The categories and channels
        createdAt: {
            type: Date,
            default: Date.now
        },
        implemented: {
            type: Boolean,
            default: false
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
