const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  walletAddress: { type: String, required: true },
  privateKey: { type: String, required: true },  // Encrypted private key
  iv: { type: String, required: true },  // Store the IV as a string
  createdAt: { type: Date, default: Date.now }
});

const Agent = mongoose.model('Agent', agentSchema);
module.exports = Agent;
