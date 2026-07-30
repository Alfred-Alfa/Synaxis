import process from 'process';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const host = process.env.SMTP_HOST || 'smtp.sendgrid.net';
const port = parseInt(process.env.SMTP_PORT || '587');
const user = process.env.SMTP_USER || 'apikey';
const pass = process.env.SMTP_PASS || '';

console.log(`Testing SMTP with Host: ${host}, Port: ${port}, User: ${user}`);

const transport = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass }
});

transport.verify(function(error, success) {
    if (error) {
        console.error("❌ SendGrid Test Failed:", error);
    } else {
        console.log("✅ Server successfully authenticated with SendGrid!");
    }
    process.exit(0);
});
