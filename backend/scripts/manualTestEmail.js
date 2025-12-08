import dotenv from 'dotenv';
import { sendWelcomeEmail } from '../src/services/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from ../.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const testEmail = async () => {
    console.log('Attempting to send test email...');
    console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        secure: process.env.SMTP_SECURE,
        from: process.env.EMAIL_FROM
    });

    try {
        const result = await sendWelcomeEmail(
            'sangeet.s@webgeon.com',
            'testPassword123',
            'Sangeet Test',
            'Webgeon Test Co'
        );
        console.log('Result:', result);
    } catch (error) {
        console.error('Failed:', error);
    }
};

testEmail();
