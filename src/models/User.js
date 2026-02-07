const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    username: String,
    avatar: String,
    guilds: [Object],
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    bufferCommands: false,
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
