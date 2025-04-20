const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    recipient: { type: String, default: "all" }, // "all" for everyone, or username for specific users
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true } // Auto-expire notifications
}, { collection: 'notifications' });

module.exports = mongoose.model('Notification', NotificationSchema);
