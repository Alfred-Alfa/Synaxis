import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
    {
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        leaveType: {
            type: String,
            enum: ['Paid', 'Unpaid', 'Sick', 'Casual'],
            required: [true, 'Leave type is required'],
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        isHalfDay: {
            type: Boolean,
            default: false,
        },
        halfDaySession: {
            type: String,
            enum: ['First Half', 'Second Half'],
            default: null,
        },
        reason: {
            type: String,
            required: [true, 'Reason is required'],
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
        approvalComment: {
            type: String,
        },
        rejectionComment: {
            type: String,
        },
        totalDays: {
            type: Number,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate total days
leaveSchema.pre('save', function (next) {
    if (this.startDate && this.endDate) {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
        this.totalDays = this.isHalfDay ? 0.5 : diffDays;
    }
    next();
});

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
