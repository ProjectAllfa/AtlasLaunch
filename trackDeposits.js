const Web3 = require('web3');
const mongoose = require('mongoose');
const Agent = require('./models/agent');
const Deposit = require('./models/deposits'); // Import your Deposit model

// Replace with your Alchemy WebSocket URL
const ALCHEMY_WS_URL = "wss://bnb-mainnet.g.alchemy.com/v2/VlQECFJ6EUl1L7LcUCuCkod-x3kO8sAD";

// Correct Web3 setup with Alchemy WebSocket provider
const web3 = new Web3(new Web3.providers.WebsocketProvider(ALCHEMY_WS_URL));

// USDT Contract details (BEP20)
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const USDT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "from", "type": "address" },
            { "indexed": true, "name": "to", "type": "address" },
            { "indexed": false, "name": "value", "type": "uint256" }
        ],
        "name": "Transfer",
        "type": "event"
    }
];

const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);

let agentWallets = new Set(); // For quick wallet lookup

const mongoURI = 'mongodb+srv://abcnewzpr:wQ9R1V5yTcjHgOme@cluster0.hvnod.mongodb.net/movie_stream?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(async () => {
        console.log("✅ Connected to MongoDB");

        // Load existing agent wallets into memory
        const agents = await Agent.find({}, 'walletAddress');
        agents.forEach(agent => agentWallets.add(agent.walletAddress.toLowerCase()));
        console.log("🔄 Loaded agent wallets:", agentWallets);

        // Watch for new agent sign-ups
        watchForNewAgents();

        // Start listening to USDT transfers
        trackUSDTDeposits();
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

function watchForNewAgents() {
    const changeStream = Agent.watch();
    changeStream.on('change', (change) => {
        if (change.operationType === 'insert') {
            const newWallet = change.fullDocument.walletAddress.toLowerCase();
            if (!agentWallets.has(newWallet)) {
                agentWallets.add(newWallet);
                console.log(`🆕 New agent detected! Tracking wallet: ${newWallet}`);
            }
        }
    });
    console.log("👀 Watching for new agent sign-ups...");
}

function trackUSDTDeposits() {
    console.log("🔍 Listening for USDT deposits...");

    const listen = () => {
        usdtContract.events.Transfer({ 
            filter: { to: Array.from(agentWallets) } // Only listen to deposits made to agent wallets
        })
        .on("data", async (event) => {
            const { from, to, value } = event.returnValues;

            const walletAddress = to.toLowerCase();
            const amount = web3.utils.fromWei(value, 'ether');
            const txHash = event.transactionHash;

            if (agentWallets.has(walletAddress)) {
                console.log(`💰 USDT Deposit Detected! ${amount} USDT sent to ${walletAddress}`);

                try {
                    const agent = await Agent.findOne({ walletAddress: new RegExp(`^${walletAddress}$`, 'i') });

                    if (!agent) {
                        console.error(`❌ No agent found with wallet address ${walletAddress}`);
                        return;
                    }

                    // Update balance
                    const updated = await Agent.findOneAndUpdate(
                        { username: agent.username, walletAddress: new RegExp(`^${walletAddress}$`, 'i') },
                        { $inc: { balance: parseFloat(amount) } },
                        { new: true }
                    );

                    console.log(`✅ Balance updated! New balance for ${agent.username}: ${updated.balance}`);

                    // Log deposit
                    await Deposit.create({
                        agentUsername: agent.username,
                        amount: parseFloat(amount),
                        txHash: txHash,
                        fromWallet: from.toLowerCase(),
                        toWallet: walletAddress,
                        timestamp: new Date()
                    });

                    console.log(`📦 Deposit record saved for ${agent.username}`);
                } catch (error) {
                    if (error.code === 11000 && error.keyPattern && error.keyPattern.txHash) {
                        console.warn(`⚠️ Duplicate txHash detected: ${txHash} (already processed)`);
                    } else {
                        console.error("⚠️ Error processing deposit:", error);
                    }
                }
            }
        })
        .on("error", (error) => {
            console.error("❌ WebSocket Error:", error);
            console.log("🔄 Reconnecting...");

            const newWeb3 = new Web3(new Web3.providers.WebsocketProvider(ALCHEMY_WS_URL));
            usdtContract.setProvider(newWeb3.currentProvider);

            listen();
        });
    };

    listen();
}
