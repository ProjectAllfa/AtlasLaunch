const crypto = require("crypto");

// Function to encrypt the private key before storing it
function encryptPrivateKey(privateKey) {
    const algorithm = "aes-256-ctr";
    const secretKey = process.env.ENCRYPTION_SECRET_KEY;  // Use a secure, environment-variable-stored secret key
    const iv = crypto.randomBytes(16);  // Generate a random initialization vector

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return both the encrypted private key and the iv (for decryption later)
    return { encryptedPrivateKey: encrypted, iv: iv.toString("hex") };
}

// Export the function
module.exports = { encryptPrivateKey };
