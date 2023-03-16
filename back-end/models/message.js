const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: String, required: true },
    receiverId: { type: String },
    message: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
    timestamp: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);