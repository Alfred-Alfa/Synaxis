import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'LOGIN',
                'LOGOUT',
                'CREATE',
                'UPDATE',
                'DELETE',
                'APPROVE',
                'REJECT',
                'GENERATE_PAYROLL',
                'EXPORT_REPORT',
                'UPLOAD_DOCUMENT',
                'CHANGE_SETTINGS',
            ],
        },
        resource: {
            type: String,
            required: true,
            // e.g., 'TimeEntry', 'Staff', 'Overtime', 'Leave', etc.
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        description: {
            type: String,
        },
        oldValue: {
            type: mongoose.Schema.Types.Mixed,
        },
        newValue: {
            type: mongoose.Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster searching
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
