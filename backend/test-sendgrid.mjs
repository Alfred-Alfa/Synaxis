import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

try {
    const info = await transport.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
        to: process.env.EMAIL_FROM,
        subject: 'HRMS Test Email - SendGrid Configuration ✅',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563EB;">✅ SendGrid Email Working!</h2>
                <p>This is a test email from your HRMS application.</p>
                <p>Your SendGrid SMTP configuration is correct and emails are being delivered.</p>
                <p style="color: #64748b; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
            </div>
        `
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
} catch (error) {
    console.error('❌ Failed to send email:', error.message);
    if (error.response) console.error('SMTP Response:', error.response);
}
