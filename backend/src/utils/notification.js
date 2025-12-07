import Notification from '../models/Notification.js';
import User from '../models/User.js';

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

        // If staffId provided, find the user
        if (!recipientId && staffId) {
            const user = await User.findOne({ staffRef: staffId });
            if (user) {
                recipientId = user._id;
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
    } catch (error) {
        console.error('Failed to notify admins:', error);
    }
};
