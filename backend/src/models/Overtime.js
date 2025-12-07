import mongoose from 'mongoose';

const overtimeSchema = new mongoose.Schema(
    {
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
        },
        startTime: {
            type: String,
        },
        endTime: {
            type: String,
        },
        otHours: {
            type: Number,
            required: [true, 'OT hours are required'],
            min: 0,
        },
        siteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Site',
            required: [true, 'Site/Project is required'],
        },
        reason: {
            type: String,
            required: [true, 'Reason/Work description is required'],
            trim: true,
        },
        attachment: {
            path: String,
            uploadDate: {
                type: Date,
                default: Date.now,
            },
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        },
        rejectionComment: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate OT hours if startTime and endTime are provided
overtimeSchema.pre('save', function (next) {
    if (this.startTime && this.endTime && !this.otHours) {
        const start = new Date(`1970-01-01T${this.startTime}:00`);
        const end = new Date(`1970-01-01T${this.endTime}:00`);
        const diff = (end - start) / (1000 * 60 * 60); // Convert to hours
        this.otHours = diff > 0 ? diff : 0;
    }
    next();
});

// Prevent modification of approved OT entries
overtimeSchema.pre('save', function (next) {
    if (!this.isNew && this.status === 'Approved') {
        const error = new Error('Cannot modify approved overtime entries');
        return next(error);
    }
    next();
});

const Overtime = mongoose.model('Overtime', overtimeSchema);

export default Overtime;
