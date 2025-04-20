const { ethers } = require("ethers");

// Generate a random BEP20 wallet
function generateBEP20Wallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
        address: wallet.address,
        privateKey: wallet.privateKey
    };
}

// Export the function
module.exports = { generateBEP20Wallet };
