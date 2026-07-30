import express from 'express';
import Payroll from '../models/Payroll.js';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';
import { isAdmin, isSuperAdmin } from '../middleware/rbac.js';
import { calculatePayroll } from '../utils/payrollCalculator.js';
import generatePayslipPDF from '../utils/pdfGenerator.js';
import logAudit from '../utils/auditLogger.js';
import { sendNotification } from '../utils/notification.js';
import { sendCompanyEmail } from '../services/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// @route   GET /api/payroll
// @desc    Get payroll records (Admin: all, Staff: only their own shared ones)
// @access  Private (all authenticated users - handler enforces role logic)
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'Staff') {
            query.staffId = req.user.staffRef;
            query.isSharedWithEmployee = true;
        }

        if (req.query.staffId) {
            query.staffId = req.query.staffId;
        }

        if (req.query.year) {
            const year = parseInt(req.query.year);
            const month = req.query.month ? parseInt(req.query.month) : null;

            let startDate, endDate;

            if (month) {
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0, 23, 59, 59, 999);
            } else {
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            }

            query.periodEnd = {
                $gte: startDate,
                $lte: endDate
            };
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
// @access  Private (all authenticated users - handler enforces role logic)
router.get('/:id', protect, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate('staffId', 'fullName email designation')
            .populate('generatedBy', 'email');

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        if (req.user.role === 'Staff') {
            if (payroll.staffId._id.toString() !== req.user.staffRef.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
            if (!payroll.isSharedWithEmployee) {
                return res.status(403).json({ message: 'This payslip has not been shared with you yet' });
            }
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
// @access  Private (SuperAdmin only)
router.post('/generate', protect, isSuperAdmin, async (req, res) => {
    try {
        const { staffId, periodStart, periodEnd, notes, taxPercentage } = req.body;

        if (!staffId || !periodStart || !periodEnd) {
            return res.status(400).json({ message: 'Staff ID, period start, and period end are required' });
        }

        // Calculate payroll with tax
        const calculation = await calculatePayroll(staffId, new Date(periodStart), new Date(periodEnd), taxPercentage || 0);

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
            existingPayroll.bonus = calculation.bonus;
            existingPayroll.taxPercentage = calculation.taxPercentage;
            existingPayroll.taxDeduction = calculation.taxDeduction;
            existingPayroll.grossPay = calculation.grossPay;
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
                bonus: calculation.bonus,
                taxPercentage: calculation.taxPercentage,
                taxDeduction: calculation.taxDeduction,
                grossPay: calculation.grossPay,
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
            .populate('staffId', 'fullName email designation hourlyRate employeeId bankDetails');

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        if (req.user.role === 'Staff') {
            if (payroll.staffId._id.toString() !== req.user.staffRef.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
            if (!payroll.isSharedWithEmployee) {
                return res.status(403).json({ message: 'This payslip has not been shared with you yet' });
            }
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
            description: req.query.view === 'inline' ? 'Viewed payslip PDF' : 'Downloaded payslip PDF',
            req,
        });

        if (req.query.view === 'inline') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="payslip.pdf"');
            return res.sendFile(outputPath);
        }

        res.download(outputPath, `payslip-${payroll.staffId.fullName}-${payroll.periodEnd}.pdf`);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payroll/:id/mark-paid
// @desc    Mark payroll as paid
// @access  Private (Admin only)
router.post('/:id/mark-paid', protect, isSuperAdmin, async (req, res) => {
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

// @route   POST /api/payroll/:id/share
// @desc    Share payroll slip with the employee
// @access  Private (Admin only)
router.post('/:id/share', protect, isSuperAdmin, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id).populate('staffId', 'fullName email designation hourlyRate employeeId bankDetails');

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        payroll.isSharedWithEmployee = true;
        payroll.sharedAt = new Date();
        await payroll.save();

        const staffId = payroll.staffId._id || payroll.staffId;
        const staffName = payroll.staffId.fullName || 'Employee';
        const periodStart = new Date(payroll.periodStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const periodEnd = new Date(payroll.periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

        // Send in-app notification
        await sendNotification({
            staffId,
            title: 'Payslip Available',
            message: `Your payslip for ${periodStart} – ${periodEnd} has been shared. You can view and download it from the Payslips section.`,
            type: 'INFO',
            link: '/staff/payslips',
        });

        // Send payslip email notification
        try {
            const user = await User.findOne({ staffRef: staffId });
            if (user && user.email) {
                const settings = await Settings.getSingleton();
                const companyName = settings.companyName || 'HRMS';
                const origin = req.headers.origin || req.headers.referer || process.env.FRONTEND_URL || 'http://localhost:5173';
                const cleanBaseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
                const payslipUrl = `${cleanBaseUrl}/staff/payslips`;

                const currency = settings.currency || '£';
                const grossPay = payroll.grossPay ? `${currency}${payroll.grossPay.toFixed(2)}` : 'N/A';
                const netPay = payroll.totalPay ? `${currency}${payroll.totalPay.toFixed(2)}` : 'N/A';

                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
                            .header { background: linear-gradient(135deg, #2563EB, #1d4ed8); color: white; padding: 25px; text-align: center; }
                            .content { padding: 30px; background: white; }
                            .payslip-summary { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; }
                            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
                            .summary-row:last-child { border-bottom: none; font-weight: bold; }
                            .button { display: inline-block; background: #2563EB; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                            .footer { padding: 20px; text-align: center; background-color: #f8fafc; color: #64748b; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2 style="margin:0;">💰 Your Payslip is Ready</h2>
                            </div>
                            <div class="content">
                                <p>Hello ${staffName},</p>
                                <p>Your payslip for the period <strong>${periodStart}</strong> to <strong>${periodEnd}</strong> has been shared with you.</p>
                                
                                <div class="payslip-summary">
                                    <h3 style="margin-top:0; color: #1e293b;">Pay Summary</h3>
                                    <table style="width:100%; border-collapse: collapse;">
                                        <tr style="border-bottom: 1px solid #e2e8f0;">
                                            <td style="padding: 8px 0; color: #64748b;">Period</td>
                                            <td style="padding: 8px 0; text-align: right; font-weight: 500;">${periodStart} – ${periodEnd}</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #e2e8f0;">
                                            <td style="padding: 8px 0; color: #64748b;">Gross Pay</td>
                                            <td style="padding: 8px 0; text-align: right; font-weight: 500;">${grossPay}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">Net Pay</td>
                                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a; font-size: 18px;">${netPay}</td>
                                        </tr>
                                    </table>
                                </div>

                                <div style="text-align: center;">
                                    <a href="${payslipUrl}" class="button">View Full Payslip</a>
                                </div>
                                <p style="font-size: 13px; color: #666;">You can view and download the full payslip from the Payslips section in your HRMS portal.</p>
                            </div>
                            <div class="footer">
                                <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                const outputDir = path.join(__dirname, '../../uploads/payslips');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                const outputPath = path.join(outputDir, `payslip-${payroll._id}.pdf`);
                // Always generate fresh so it has latest data just in case
                await generatePayslipPDF(payroll, payroll.staffId, settings, outputPath);

                await sendCompanyEmail(settings._id, {
                    to: user.email,
                    subject: `Your Payslip for ${periodStart} – ${periodEnd} is Ready`,
                    html,
                    attachments: [
                        {
                            filename: `payslip-${payroll.staffId.fullName}-${periodEnd}.pdf`,
                            path: outputPath
                        }
                    ]
                });
            }
        } catch (emailError) {
            console.error('Failed to send payslip email:', emailError);
            // Don't fail the request if email fails
        }

        await logAudit({
            userId: req.user._id,
            action: 'SHARE_PAYSLIP',
            resource: 'Payroll',
            resourceId: payroll._id,
            description: `Shared payslip with employee ${staffName}`,
            req,
        });

        res.json({
            success: true,
            message: 'Payslip shared with employee successfully',
            data: payroll,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/payroll/:id
// @desc    Update payroll record (override)
// @access  Private (Admin only)
router.put('/:id', protect, isSuperAdmin, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        const fieldsToUpdate = [
            'normalHours', 'normalPay', 'otHours', 'otPay',
            'travelExpenses', 'leaveDeductions', 'bonus', 'taxPercentage', 'taxDeduction',
            'grossPay', 'totalPay', 'notes', 'isPaid'
        ];

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                payroll[field] = req.body[field];
            }
        });

        // Ensure manual update updates the record
        const updatedPayroll = await payroll.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Payroll',
            resourceId: payroll._id,
            description: 'Updated payroll record manually',
            newValue: updatedPayroll,
            req,
        });

        res.json({
            success: true,
            data: updatedPayroll,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/payroll/:id
// @desc    Delete payroll record
// @access  Private (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        await payroll.deleteOne();

        await logAudit({
            userId: req.user._id,
            action: 'DELETE',
            resource: 'Payroll',
            resourceId: req.params.id,
            description: 'Deleted payroll record',
            req,
        });

        res.json({
            success: true,
            message: 'Payroll record removed',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
