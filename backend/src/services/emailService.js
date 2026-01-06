import nodemailer from 'nodemailer';

// Create transporter with hardcoded ZeptoMail credentials
const createTransporter = () => {
    return nodemailer.createTransport({
        host: "smtp.zeptomail.in",
        port: 587,
        auth: {
            user: "emailapikey",
            pass: "PHtE6r0JRLq9iG97pxgH4vG4RMClZNgvrOsyJFUUsIdKW/ILHk0AoogukzPl/hd/XfcURqbPz449uLjIsOnUdDq+ZzxJCmqyqK3sx/VYSPOZsbq6x00at1oackDeXYfud95i1CfTstrdNA=="
        }
    });
};

const getFromAddress = () => {
    return '"Webgeon HRMS" <hrms@webgeon.com>';
};

export const sendPasswordResetEmail = async (email, resetToken, userName) => {
    try {
        const transporter = createTransporter();
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: 'Password Reset Request - Webgeon HRMS',
            html: `
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
                            <p>We received a request to reset your password for the Webgeon HRMS portal.</p>
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>
                            <p>Link: <a href="${resetUrl}">${resetUrl}</a></p>
                            <p style="font-size: 13px; color: #666;">This link expires in 1 hour.</p>
                        </div>
                        <div class="footer">
                            <p>© 2026 Webgeon Results Pvt Ltd. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✉️  Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

export const sendWelcomeEmail = async (email, tempPassword, userName, companyName = 'Webgeon') => {
    try {
        const transporter = createTransporter();
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: `Welcome to Webgeon HRMS - Account Access`,
            html: `
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
                            <h2 style="color: white; margin:0;">Webgeon HRMS</h2>
                        </div>
                        <div class="content">
                            <p>Hello ${userName},</p>
                            <p>Welcome to the team! An account has been created for you on our new centralized HR Management System.</p>
                            
                            <p><strong>Why use Webgeon HRMS?</strong><br>
                            We are transitioning to this platform to streamline:</p>
                            <ul style="padding-left: 20px;">
                                <li>Daily Attendance & Time Tracking</li>
                                <li>Leave Requests & Approvals</li>
                                <li>Payroll & Payslip Management</li>
                                <li>Project & Task Allocation</li>
                            </ul>

                            <div class="credentials">
                                <h3 style="margin-top:0;">Your Login Credentials</h3>
                                <p style="margin-bottom: 5px;"><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                                <p style="margin-bottom: 5px;"><strong>Email:</strong> ${email}</p>
                                <p style="margin-bottom: 0;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
                            </div>

                            <div style="text-align: center;">
                                <a href="${loginUrl}" class="button">Login to Portal</a>
                            </div>

                            <div class="guidelines">
                                <h3 style="margin-top:0; font-size: 16px;">🚀 Quick Guidelines</h3>
                                <ol style="padding-left: 20px; margin-bottom: 0;">
                                    <li>Login using the credentials above.</li>
                                    <li>Change your password immediately upon first login.</li>
                                    <li>Update your profile with accurate contact details.</li>
                                    <li>Check the "Timesheets" section daily to log your hours.</li>
                                </ol>
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2026 Webgeon Results Pvt Ltd. All rights reserved.<br>
                            This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✉️  Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        return { success: false, error: error.message };
    }
};
