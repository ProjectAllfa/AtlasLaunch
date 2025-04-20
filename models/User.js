const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    subscriptionExpiry: { type: Date, required: true },
    deviceSession: { type: String, default: null }, // Stores active session token
    isAdmin: { type: Boolean, default: false }, // Explicitly define as Boolean
    type: { type: String, enum: ['trial', 'paid'], default: 'trial' }, // ✅ New field

    // ✅ New Optional Fields
    accountName: { type: String, default: "" },
    accountPhone: { type: String, default: "" },
    agentName: { type: String, default: "" },
    agentPhone: { type: String, default: "" },
    accountCreationDate: { type: Date, default: Date.now } // Auto-set on creation
}, { collection: 'users' });

// ✅ Virtual field to determine if the account is active
UserSchema.virtual('active').get(function () {
    return this.subscriptionExpiry > new Date(); // true if expiry date is in the future
});

module.exports = mongoose.model('User', UserSchema);
