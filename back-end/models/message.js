const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: String, required: true },
    receiverId: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);