import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema(
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
            required: function () {
                return !this.totalHours;
            },
        },
        endTime: {
            type: String,
            required: function () {
                return !this.totalHours;
            },
        },
        totalHours: {
            type: Number,
            min: 0,
        },
        siteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Site',
            required: [true, 'Site/Project is required'],
        },
        jobDescription: {
            type: String,
            required: [true, 'Job description is required'],
            trim: true,
        },
        ownTransport: {
            type: Boolean,
            default: false,
        },
        travelDetails: {
            distance: String,
            amount: Number,
            notes: String,
        },
        attachments: [
            {
                path: String,
                uploadDate: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
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

// Calculate totalHours if startTime and endTime are provided
timeEntrySchema.pre('save', function (next) {
    if (this.startTime && this.endTime && !this.totalHours) {
        const start = new Date(`1970-01-01T${this.startTime}:00`);
        const end = new Date(`1970-01-01T${this.endTime}:00`);
        const diff = (end - start) / (1000 * 60 * 60); // Convert to hours
        this.totalHours = diff > 0 ? diff : 0;
    }
    next();
});

// Prevent modification of approved entries
timeEntrySchema.pre('save', function (next) {
    // Allow saving if status is being changed (e.g. Pending -> Approved)
    if (!this.isNew && this.status === 'Approved' && !this.isModified('status')) {
        const error = new Error('Cannot modify approved time entries');
        return next(error);
    }
    next();
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

export default TimeEntry;
