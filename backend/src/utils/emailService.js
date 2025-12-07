import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    host: "smtp.zeptomail.in",
    port: 587,
    auth: {
        user: "emailapikey",
        pass: "PHtE6r1fE+7ii2569hlTs6S9FpanZo0oqOJifgNP4ttCXvJQS01c+NgjlzSx/Up/BKZCHfKTzok75+yZ5e6MJGfqNGxFX2qyqK3sx/VYSPOZsbq6x00ctV4cfkTYXIXrctNu0yfRv9reNA=="
    }
});

export const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: '"HRMS Team" <noreply@elitecraftuk.com>',
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
