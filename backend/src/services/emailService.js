import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
    // For development: Use Ethereal (fake SMTP)
    // For production: Configure with real SMTP credentials

    // Check for SMTP or ZeptoMail configuration
    const host = process.env.SMTP_HOST || process.env.ZEPTOMAIL_HOST;

    if (host) {
        return nodemailer.createTransport({
            host: host,
            port: parseInt(process.env.SMTP_PORT || process.env.ZEPTOMAIL_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // Default to false for port 587
            auth: {
                user: process.env.SMTP_USER || process.env.ZEPTOMAIL_USER,
                pass: process.env.SMTP_PASS || process.env.ZEPTOMAIL_PASS,
            },
        });
    } else {
        // Fallback to Ethereal only if no compatible credentials are provided
        console.log('Using Ethereal Mail (No SMTP/ZeptoMail settings provided)');
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.ETHEREAL_USER || 'test@ethereal.email',
                pass: process.env.ETHEREAL_PASS || 'test123',
            },
        });
    }
};

const getFromAddress = () => {
    if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
    if (process.env.EMAIL_FROM_ADDRESS) {
        return process.env.EMAIL_FROM_NAME
            ? `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`
            : process.env.EMAIL_FROM_ADDRESS;
    }
    return 'HRMS <noreply@hrms.com>';
};

export const sendPasswordResetEmail = async (email, resetToken, userName) => {
    try {
        const transporter = createTransporter();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: 'Password Reset Request - HRMS',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${userName},</p>
                            <p>We received a request to reset your password for your HRMS account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="color: #667eea; word-break: break-all;">${resetUrl}</p>
                            <p><strong>This link will expire in 1 hour.</strong></p>
                            <p>If you didn't request a password reset, please ignore this email or contact your administrator if you have concerns.</p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                            <p style="color: #999; font-size: 14px;">
                                For security reasons, this password reset link will expire in 60 minutes.
                            </p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} HRMS. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('✉️  Password reset email sent:', {
            to: email,
            messageId: info.messageId,
            preview: nodemailer.getTestMessageUrl(info),
        });

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info),
        };
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

export const sendWelcomeEmail = async (email, tempPassword, userName, companyName = 'HRMS') => {
    try {
        const transporter = createTransporter();

        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: `Welcome to ${companyName} - Your Account Details`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>👋 Welcome to ${companyName}!</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${userName},</p>
                            <p>Your account for <strong>${companyName}</strong> has been created successfully. Here are your login credentials:</p>
                            <div class="credentials">
                                <p><strong>Email:</strong> ${email}</p>
                                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${tempPassword}</code></p>
                            </div>
                            <p><strong>⚠️ Important:</strong> For security reasons, you will be required to change your password on first login.</p>
                            <div style="text-align: center;">
                                <a href="${loginUrl}" class="button">Login Now</a>
                            </div>
                            <p>If you have any questions, please contact your administrator.</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} HRMS. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('✉️  Welcome email sent:', {
            to: email,
            messageId: info.messageId,
            preview: nodemailer.getTestMessageUrl(info),
        });

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info),
        };
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        // Don't throw - email is not critical for account creation
        return { success: false, error: error.message };
    }
};
