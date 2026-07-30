import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        employeeId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true, // Allows null/undefined for existing records
        },
        phone: {
            type: String,
            trim: true,
        },
        hourlyRate: {
            type: Number,
            required: [true, 'Hourly rate is required'],
            min: 0,
        },
        hourlyRateHistory: [
            {
                rate: {
                    type: Number,
                    required: true,
                },
                effectiveDate: {
                    type: Date,
                    required: true,
                },
                changedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            },
        ],
        address: {
            type: String,
            trim: true,
        },
        startDate: {
            type: Date,
        },
        designation: {
            type: String,
            trim: true,
        },
        documents: [
            {
                name: String,
                path: String,
                uploadDate: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        bankDetails: {
            accountNumber: String,
            bankName: String,
            ifscCode: String,
            accountHolderName: String,
        },
        employmentStatus: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
        otRate: {
            type: Number,
            min: 0,
            // If set, this overrides site and global OT rates for this staff member
        },
        leaveBalance: {
            type: Number,
            default: 0,
            min: 0,
            // Available leave balance in days
        },
        standardPayableHours: {
            type: Number,
            default: 0,
            min: 0,
            // Expected normal working hours per month for payroll
        },
        homeLocation: {
            label: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            },
            radius: {
                type: Number,
                default: 150
            }
        },
        profilePhoto: {
            type: String, // URL/Path to staff profile photo
        }
    },
    {
        timestamps: true,
    }
);

// Add initial hourly rate to history on creation
staffSchema.pre('save', function (next) {
    if (this.isNew) {
        this.hourlyRateHistory.push({
            rate: this.hourlyRate,
            effectiveDate: new Date(),
            changedBy: this._changedBy, // Set in controller
        });
    }
    next();
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
