import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
    {
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        periodStart: {
            type: Date,
            required: [true, 'Period start date is required'],
        },
        periodEnd: {
            type: Date,
            required: [true, 'Period end date is required'],
        },
        normalHours: {
            type: Number,
            default: 0,
            min: 0,
        },
        normalPay: {
            type: Number,
            default: 0,
            min: 0,
        },
        otHours: {
            type: Number,
            default: 0,
            min: 0,
        },
        otPay: {
            type: Number,
            default: 0,
            min: 0,
        },
        travelExpenses: {
            type: Number,
            default: 0,
            min: 0,
        },
        leaveDeductions: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalPay: {
            type: Number,
            required: true,
            min: 0,
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate total pay before saving
payrollSchema.pre('save', function (next) {
    this.totalPay = this.normalPay + this.otPay + this.travelExpenses - this.leaveDeductions;
    next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;
