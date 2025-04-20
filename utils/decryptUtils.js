const crypto = require("crypto");

// Function to decrypt the private key when needed
function decryptPrivateKey(encryptedPrivateKey, iv) {
    const algorithm = "aes-256-ctr";
    const secretKey = process.env.ENCRYPTION_SECRET_KEY;

    // Convert encrypted private key and IV to buffers
    const ivBuffer = Buffer.from(iv, "hex"); 
    const encryptedBuffer = Buffer.from(encryptedPrivateKey, "hex");

    // Create decipher and decrypt the private key
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), ivBuffer);
    let decrypted = decipher.update(encryptedBuffer, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted; // Return the decrypted private key
}

// Export the function
module.exports = { decryptPrivateKey };
