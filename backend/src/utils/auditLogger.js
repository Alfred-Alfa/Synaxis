import AuditLog from '../models/AuditLog.js';

/**
 * Log an action to the audit log
 * @param {Object} options - Logging options
 * @param {ObjectId} options.userId - User performing the action
 * @param {string} options.action - Action type (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} options.resource - Resource type (e.g., 'TimeEntry', 'Staff')
 * @param {ObjectId} options.resourceId - ID of the affected resource
 * @param {string} options.description - Description of the action
 * @param {any} options.oldValue - Previous value (for updates)
 * @param {any} options.newValue - New value (for creates/updates)
 * @param {Object} options.req - Express request object (for IP and user agent)
 */
export const logAudit = async ({
    userId,
    action,
    resource,
    resourceId,
    description,
    oldValue,
    newValue,
    req,
}) => {
    try {
        await AuditLog.create({
            userId,
            action,
            resource,
            resourceId,
            description,
            oldValue,
            newValue,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('user-agent'),
        });
    } catch (error) {
        console.error('Error logging audit:', error);
        // Don't throw - we don't want audit logging failures to break the main flow
    }
};

export default logAudit;
