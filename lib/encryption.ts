import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'warzone-monster-secret-key-32ch'; // Must be 32 characters
const IV_LENGTH = 16; // For AES, this is always 16

// Ensure key is exactly 32 bytes
const getEncryptionKey = () => {
    const key = ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);
    return Buffer.from(key);
};

/**
 * Encrypt sensitive text data
 */
export function encrypt(text: string): string {
    if (!text) return '';

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (separated by :)
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive text data
 */
export function decrypt(text: string): string {
    if (!text) return '';

    try {
        const parts = text.split(':');

        // Check if we have at least 2 parts (IV and encrypted text) and the IV is the correct length for hex (32 chars = 16 bytes)
        if (parts.length < 2 || parts[0].length !== 32) {
            // Assume it's not encrypted or legacy data, return original
            return text;
        }

        const iv = Buffer.from(parts[0], 'hex');

        // Double check IV buffer length just to be sure
        if (iv.length !== 16) {
            return text;
        }

        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // If decryption fails for any reason (e.g. wrong key, tampered data), return original text
        // console.warn('Decryption failed, returning original text:', error.message);
        return text;
    }
}

/**
 * Hash password (one-way, cannot be decrypted)
 */
export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Encrypt card data before saving to database
 */
export function encryptCardData(cardData: any) {
    return {
        ...cardData,
        cardNumber: encrypt(cardData.cardNumber),
        cvv: cardData.cvv ? encrypt(cardData.cvv) : undefined,
        holder: cardData.holder ? encrypt(cardData.holder) : undefined,
        address: cardData.address ? encrypt(cardData.address) : undefined,
        ssn: cardData.ssn ? encrypt(cardData.ssn) : undefined,
        dob: cardData.dob ? encrypt(cardData.dob) : undefined,
        email: cardData.email ? encrypt(cardData.email) : undefined,
        phone: cardData.phone ? encrypt(cardData.phone) : undefined,
        password: cardData.password ? encrypt(cardData.password) : undefined,
        ip: cardData.ip ? encrypt(cardData.ip) : undefined,
    };
}

/**
 * Decrypt card data after fetching from database
 */
export function decryptCardData(cardData: any) {
    return {
        ...cardData,
        cardNumber: decrypt(cardData.cardNumber),
        cvv: cardData.cvv ? decrypt(cardData.cvv) : undefined,
        holder: cardData.holder ? decrypt(cardData.holder) : undefined,
        address: cardData.address ? decrypt(cardData.address) : undefined,
        ssn: cardData.ssn ? decrypt(cardData.ssn) : undefined,
        dob: cardData.dob ? decrypt(cardData.dob) : undefined,
        email: cardData.email ? decrypt(cardData.email) : undefined,
        phone: cardData.phone ? decrypt(cardData.phone) : undefined,
        password: cardData.password ? decrypt(cardData.password) : undefined,
        ip: cardData.ip ? decrypt(cardData.ip) : undefined,
    };
}
