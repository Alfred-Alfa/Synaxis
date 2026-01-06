import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
// Use a secure key in production. Fallback for dev only.
// Ensure key is 32 bytes for aes-256
const secretKey = crypto.scryptSync(process.env.APP_SECRET || 'webjeon-hrms-secret-key-2026', 'salt', 32);

export const encrypt = (text) => {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

export const decrypt = (hash) => {
    if (!hash || !hash.iv || !hash.content) return null;
    const iv = Buffer.from(hash.iv, 'hex');
    const encryptedText = Buffer.from(hash.content, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
