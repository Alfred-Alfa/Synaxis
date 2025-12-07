import express from 'express';
import Payroll from '../models/Payroll.js';
import Staff from '../models/Staff.js';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { calculatePayroll } from '../utils/payrollCalculator.js';
import generatePayslipPDF from '../utils/pdfGenerator.js';
import logAudit from '../utils/auditLogger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// @route   GET /api/payroll
// @desc    Get payroll records (Admin: all, Staff: own)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'Staff') {
            query.staffId = req.user.staffRef;
        }

        if (req.query.staffId) {
            query.staffId = req.query.staffId;
        }

        const payrolls = await Payroll.find(query)
            .populate('staffId', 'fullName email')
            .populate('generatedBy', 'email')
            .sort({ periodEnd: -1 });

        res.json({
            success: true,
            count: payrolls.length,
            data: payrolls,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/payroll/:id
// @desc    Get payroll by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate('staffId', 'fullName email designation')
            .populate('generatedBy', 'email');

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        if (req.user.role === 'Staff' && payroll.staffId._id.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            success: true,
            data: payroll,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payroll/generate
// @desc    Generate payroll for staff for a period
// @access  Private (Admin only)
router.post('/generate', protect, isAdmin, async (req, res) => {
    try {
        const { staffId, periodStart, periodEnd, notes } = req.body;

        if (!staffId || !periodStart || !periodEnd) {
            return res.status(400).json({ message: 'Staff ID, period start, and period end are required' });
        }

        // Calculate payroll
        const calculation = await calculatePayroll(staffId, new Date(periodStart), new Date(periodEnd));

        // Check if payroll already exists for this period
        const existingPayroll = await Payroll.findOne({
            staffId,
            periodStart,
            periodEnd,
        });

        let payroll;

        if (existingPayroll) {
            // Update existing payroll
            existingPayroll.normalHours = calculation.normalHours;
            existingPayroll.normalPay = calculation.normalPay;
            existingPayroll.otHours = calculation.otHours;
            existingPayroll.otPay = calculation.otPay;
            existingPayroll.travelExpenses = calculation.travelExpenses;
            existingPayroll.leaveDeductions = calculation.leaveDeductions;
            existingPayroll.totalPay = calculation.totalPay;
            existingPayroll.notes = notes;
            existingPayroll.generatedBy = req.user._id;

            payroll = await existingPayroll.save();
        } else {
            // Create new payroll
            payroll = await Payroll.create({
                staffId,
                periodStart,
                periodEnd,
                normalHours: calculation.normalHours,
                normalPay: calculation.normalPay,
                otHours: calculation.otHours,
                otPay: calculation.otPay,
                travelExpenses: calculation.travelExpenses,
                leaveDeductions: calculation.leaveDeductions,
                totalPay: calculation.totalPay,
                notes,
                generatedBy: req.user._id,
            });
        }

        await logAudit({
            userId: req.user._id,
            action: 'GENERATE_PAYROLL',
            resource: 'Payroll',
            resourceId: payroll._id,
            description: `Generated payroll for period ${periodStart} to ${periodEnd}`,
            newValue: payroll,
            req,
        });

        res.status(201).json({
            success: true,
            data: payroll,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/payroll/:id/payslip
// @desc    Download payslip PDF
// @access  Private
router.get('/:id/payslip', protect, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate('staffId', 'fullName email designation hourlyRate');

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        if (req.user.role === 'Staff' && payroll.staffId._id.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const settings = await Settings.getSingleton();

        // Generate PDF
        const outputDir = path.join(__dirname, '../../uploads/payslips');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, `payslip-${payroll._id}.pdf`);

        await generatePayslipPDF(payroll, payroll.staffId, settings, outputPath);

        await logAudit({
            userId: req.user._id,
            action: 'EXPORT_REPORT',
            resource: 'Payroll',
            resourceId: payroll._id,
            description: 'Downloaded payslip PDF',
            req,
        });

        res.download(outputPath, `payslip-${payroll.staffId.fullName}-${payroll.periodEnd}.pdf`);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payroll/:id/mark-paid
// @desc    Mark payroll as paid
// @access  Private (Admin only)
router.post('/:id/mark-paid', protect, isAdmin, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        payroll.isPaid = true;
        payroll.paidAt = new Date();
        await payroll.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Payroll',
            resourceId: payroll._id,
            description: 'Marked payroll as paid',
            req,
        });

        res.json({
            success: true,
            data: payroll,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
