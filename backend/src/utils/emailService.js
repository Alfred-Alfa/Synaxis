import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'apikey',
            pass: process.env.SMTP_PASS || ''
        }
    });

    const fromName = process.env.EMAIL_FROM_NAME || 'HRMS Mail';
    const fromEmail = process.env.EMAIL_FROM || 'alfredfrancis2004@gmail.com';

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
    };

    try {
        const info = await transport.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // We don't want to block the flow if email fails, so we just log it
        return null;
    }
};
