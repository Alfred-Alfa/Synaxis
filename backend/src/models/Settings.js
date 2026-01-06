import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
    {
        timezone: {
            type: String,
            default: 'UTC',
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'GBP', 'EUR', 'INR', 'SGD', 'AUD', 'CAD', 'AED'],
        },
        companyName: {
            type: String,
            default: 'Company Name',
        },
        companyEmail: {
            type: String,
            default: '',
        },
        phoneCountryCode: {
            type: String,
            default: '+1',
        },
        companyPhone: {
            type: String,
            default: '',
        },
        companyAddress: {
            street: String,
            city: String,
            state: String,
            zip: String,
            country: String,
        },
        companyLogo: {
            type: String,
            // Path to uploaded logo
        },
        workingHoursPerDay: {
            type: Number,
            default: 8,
            min: 1,
            max: 24,
        },
        globalOtRate: {
            type: Number,
            default: 1.5,
            min: 1,
            // Multiplier for hourly rate (e.g., 1.5 = 1.5x hourly rate)
        },
        leaveTypes: [
            {
                name: {
                    type: String,
                    required: true,
                },
                isPaid: {
                    type: Boolean,
                    default: false,
                },
                // Future: allowance per year
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Ensure only one settings document exists
settingsSchema.statics.getSingleton = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            leaveTypes: [
                { name: 'Paid', isPaid: true },
                { name: 'Unpaid', isPaid: false },
                { name: 'Sick', isPaid: true },
                { name: 'Casual', isPaid: true },
            ],
        });
    }
    return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
