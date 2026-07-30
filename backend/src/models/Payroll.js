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
        bonus: {
            type: Number,
            default: 0,
            min: 0,
        },
        taxPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        taxDeduction: {
            type: Number,
            default: 0,
            min: 0,
        },
        grossPay: {
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
        isSharedWithEmployee: {
            type: Boolean,
            default: false,
        },
        sharedAt: {
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
    this.grossPay = this.normalPay + this.otPay + this.travelExpenses + (this.bonus || 0) - this.leaveDeductions;
    const taxAmt = (this.grossPay * (this.taxPercentage || 0)) / 100;
    this.taxDeduction = Math.round(taxAmt * 100) / 100;
    this.totalPay = Math.max(0, this.grossPay - this.taxDeduction);
    next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;
