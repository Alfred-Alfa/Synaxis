import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    host: process.env.ZEPTOMAIL_HOST || "smtp.zeptomail.in",
    port: process.env.ZEPTOMAIL_PORT || 587,
    auth: {
        user: process.env.ZEPTOMAIL_USER,
        pass: process.env.ZEPTOMAIL_PASS
    }
});

export const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'HRMS Team'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@elitecraftuk.com'}>`,
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
        // Or should we throw? Usually notification failure shouldn't fail the request.
        return null;
    }
};
