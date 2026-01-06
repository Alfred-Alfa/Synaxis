import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    to_email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        required: true
    },
    error_message: {
        type: String
    },
    sent_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

export default EmailLog;
