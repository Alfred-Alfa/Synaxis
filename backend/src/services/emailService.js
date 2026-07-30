import nodemailer from 'nodemailer';
import CompanyEmailSettings from '../models/CompanyEmailSettings.js';
import EmailLog from '../models/EmailLog.js';
import Settings from '../models/Settings.js';
import { decrypt } from '../utils/encryption.js';

// Cache for transporters to avoid recreating on every send (optional, but good for perf)
// Key: companyId, Value: transporter
const transporterCache = new Map();

/**
 * Get email configuration for a company
 * @param {string} companyId 
 */
export const getCompanyEmailConfig = async (companyId) => {
    try {
        if (!companyId) return null;

        // Use active config first; fall back to verified config if not yet toggled active
        const config = await CompanyEmailSettings.findOne({
            company_id: companyId,
            $or: [{ is_active: true }, { is_verified: true }]
        });

        if (!config) return null;

        // Decrypt password
        const decryptedPass = decrypt(config.smtp_pass_encrypted);

        if (!decryptedPass) {
            console.error(`Failed to decrypt SMTP password for company ${companyId}`);
            return null;
        }

        return {
            host: config.smtp_host,
            port: config.smtp_port,
            secure: config.smtp_port === 465, // True for 465, false for 587
            auth: {
                user: config.smtp_user,
                pass: decryptedPass
            },
            from: `"${config.from_name}" <${config.from_email}>`
        };
    } catch (error) {
        console.error('Error fetching company email config:', error);
        return null;
    }
};

/**
 * Create Nodemailer transporter
 * @param {object} config 
 */
const createTransport = (config) => {
    // If we have a DB config, use it
    if (config) {
        return nodemailer.createTransport(config);
    }

    // Fallback to Environment Variables (SendGrid)
    // This ensures we never break production even if DB config is missing
    const host = process.env.SMTP_HOST || 'smtp.sendgrid.net';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER || 'apikey';
    // Strip surrounding quotes if accidentally present (common .env copy-paste issue)
    const rawPass = process.env.SMTP_PASS || '';
    const pass = rawPass.replace(/^"|"$/g, '').replace(/^'|'$/g, '');

    // If no env vars, fallback to Ethereal (Dev only)
    if (!pass) {
        console.warn('⚠️  No SMTP credentials found in DB or ENV. Using Ethereal (emails will NOT be delivered).');
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'test@ethereal.email',
                pass: 'test1234'
            }
        });
    }

    console.log(`📧 Using ENV fallback SMTP: ${host}:${port} (user: ${user})`);
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });
};

/**
 * Get Default/System Company ID
 * Helper to support existing calls that don't pass companyId
 */
const getDefaultCompanyId = async () => {
    // In this current architecture, there is only one Settings doc
    const settings = await Settings.getSingleton();
    return settings._id;
};

/**
 * Get Default From Address
 */
const getDefaultFromAddress = () => {
    const fromName = process.env.EMAIL_FROM_NAME || 'HRMS Mail';
    const fromEmail = process.env.EMAIL_FROM || 'alfredfrancis2004@gmail.com';
    return `"${fromName}" <${fromEmail}>`;
};

/**
 * Send Email Core Function
 * @param {string} companyId - ID of the company (tenant)
 * @param {object} mailOptions - { to, subject, html }
 */
export const sendCompanyEmail = async (companyId, { to, subject, html, attachments }) => {
    let status = 'failure';
    let errorMessage = '';

    try {
        // 1. Get Config
        const dbConfig = await getCompanyEmailConfig(companyId);

        // 2. Create Transporter
        const transporter = createTransport(dbConfig);

        // 3. Determine 'From' address
        // If DB config exists, use it. Else fallback to default/env.
        const from = dbConfig ? dbConfig.from : getDefaultFromAddress();

        // 4. Send Mail
        const finalMailOptions = {
            from,
            to,
            subject,
            html,
            attachments
        };

        const info = await transporter.sendMail(finalMailOptions);

        status = 'success';
        console.log(`✉️  Email sent to ${to} [ID: ${info.messageId}]`);

        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error sending email:', error);
        errorMessage = error.message;
        return { success: false, error: error.message };
    } finally {
        // 5. Log to DB
        if (companyId) {
            try {
                await EmailLog.create({
                    company_id: companyId,
                    to_email: to,
                    subject,
                    status,
                    error_message: errorMessage
                });
            } catch (logError) {
                console.error('Failed to save email log:', logError);
            }
        }
    }
};

// ==========================================
// BACKWARD COMPATIBILITY WRAPPERS
// ==========================================

export const sendPasswordResetEmail = async (email, resetToken, userName, origin) => {
    const companyId = await getDefaultCompanyId();
    // origin is derived from the HTTP request headers (req.headers.origin)
    // No env variable needed — the backend reads the caller's origin dynamically
    if (!origin) {
        console.error('❌ No origin provided for password reset email. Cannot build reset URL.');
        return { success: false, error: 'Unable to determine application URL from request. Please try again.' };
    }
    // Remove trailing slash if present to avoid double slash
    const cleanBaseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const resetUrl = `${cleanBaseUrl}/reset-password/${resetToken}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
                .header { background: #2563EB; color: white; padding: 25px; text-align: center; }
                .content { padding: 30px; background: white; }
                .button { display: inline-block; background: #2563EB; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { padding: 20px; text-align: center; background-color: #f8fafc; color: #64748b; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin:0;">Password Reset</h2>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    <p>We received a request to reset your password.</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    <p>Link: <a href="${resetUrl}">${resetUrl}</a></p>
                    <p style="font-size: 13px; color: #666;">This link expires in 1 hour.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} SYNTAX HRMS. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendCompanyEmail(companyId, {
        to: email,
        subject: 'Password Reset Request',
        html
    });
};

export const sendWelcomeEmail = async (email, tempPassword, userName, companyName = 'SYNTAX HRMS', origin) => {
    const companyId = await getDefaultCompanyId();
    // origin is derived from the HTTP request headers (req.headers.origin)
    // No env variable needed — the backend reads the caller's origin dynamically
    const cleanBaseUrl = origin ? (origin.endsWith('/') ? origin.slice(0, -1) : origin) : '';
    const loginUrl = `${cleanBaseUrl}/login`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
                .header { background: #0F172A; color: white; padding: 25px; text-align: center; }
                .content { padding: 30px; background: white; }
                .credentials { background: #F1F5F9; padding: 20px; border-left: 4px solid #2563EB; border-radius: 4px; margin: 20px 0; }
                .button { display: inline-block; background: #2563EB; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .guidelines { background: #FFF7ED; padding: 15px; border-radius: 4px; border: 1px solid #FFEDD5; margin-top: 20px; }
                .footer { padding: 20px; text-align: center; background-color: #f8fafc; color: #64748b; font-size: 12px; }
                h2 { color: #0F172A; margin-top: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="color: white; margin:0;">Welcome to ${companyName}</h2>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    <p>Welcome to the team! An account has been created for you on our HR Management System.</p>
                    
                    <div class="credentials">
                        <h3 style="margin-top:0;">Your Login Credentials</h3>
                        <p style="margin-bottom: 5px;"><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                        <p style="margin-bottom: 5px;"><strong>Email:</strong> ${email}</p>
                        <p style="margin-bottom: 0;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
                    </div>

                    <div style="text-align: center;">
                        <a href="${loginUrl}" class="button">Login to Portal</a>
                    </div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendCompanyEmail(companyId, {
        to: email,
        subject: `Welcome to ${companyName} - Account Access`,
        html
    });
};
