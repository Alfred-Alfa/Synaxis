import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from './emailService.js';

/**
 * Send a notification to a user
 * @param {Object} options
 * @param {string} options.userId - User ID (optional if staffId provided)
 * @param {string} options.staffId - Staff ID (to find User)
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - INFO, SUCCESS, WARNING, ERROR
 * @param {string} options.link - Link to redirect
 */
export const sendNotification = async ({ userId, staffId, title, message, type = 'INFO', link }) => {
    try {
        let recipientId = userId;
        let recipientEmail;

        // If staffId provided, find the user
        if (!recipientId && staffId) {
            const user = await User.findOne({ staffRef: staffId });
            if (user) {
                recipientId = user._id;
                recipientEmail = user.email;
            }
        } else if (userId) {
            const user = await User.findById(userId);
            if (user) {
                recipientEmail = user.email;
            }
        }

        if (!recipientId) {
            console.warn('Notification not sent: No recipient found');
            return;
        }

        await Notification.create({
            recipientId,
            title,
            message,
            type,
            link,
        });

        // Send Email to Employee
        if (recipientEmail) {
            await sendEmail(
                recipientEmail,
                title,
                `<p>Hello,</p>
                 <p>${message}</p>
                 <p>Please log in to the HRMS portal for more details.</p>
                 <br>
                 <p>Best regards,<br>HRMS Team</p>`
            );
        }
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
};

/**
 * Send notification to all admins
 */
export const notifyAdmins = async ({ title, message, type = 'INFO', link }) => {
    try {
        const admins = await User.find({ role: { $in: ['Admin', 'SuperAdmin'] } });

        const notifications = admins.map(admin => ({
            recipientId: admin._id,
            title,
            message,
            type,
            link,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Send emails effectively
        const emailPromises = admins.map(admin =>
            sendEmail(
                admin.email,
                `Action Required: ${title}`,
                `<p>Hello ${admin.role},</p>
                 <p>${message}</p>
                 <p>Please log in to the HRMS portal to review.</p>
                 <br>
                 <p>Best regards,<br>HRMS Team</p>`
            )
        );

        await Promise.allSettled(emailPromises);
    } catch (error) {
        console.error('Failed to notify admins:', error);
    }
};
