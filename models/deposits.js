const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  agentUsername: { type: String, required: true },
  amount: { type: Number, required: true },
  txHash: { type: String, required: true, unique: true },
  fromWallet: { type: String, required: true },
  toWallet: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
});

const Deposit = mongoose.model('Deposit', depositSchema);
module.exports = Deposit;
