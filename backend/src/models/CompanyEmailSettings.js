import mongoose from 'mongoose';

const companyEmailSettingsSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    provider: {
        type: String,
        default: 'zeptomail',
        enum: ['zeptomail', 'smtp', 'sendgrid', 'aws']
    },
    smtp_host: {
        type: String,
        required: true
    },
    smtp_port: {
        type: Number,
        default: 587
    },
    smtp_user: {
        type: String,
        default: 'emailapikey'
    },
    smtp_pass_encrypted: {
        iv: { type: String, required: true },
        content: { type: String, required: true }
    },
    from_email: {
        type: String,
        required: true
    },
    from_name: {
        type: String,
        required: true
    },
    reply_to: {
        type: String
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Prevent multiple configs for same company (unless we want history, but usually 1 active config)
companyEmailSettingsSchema.index({ company_id: 1 }, { unique: true });

const CompanyEmailSettings = mongoose.model('CompanyEmailSettings', companyEmailSettingsSchema);

export default CompanyEmailSettings;
