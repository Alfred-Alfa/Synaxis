import TimeEntry from '../models/TimeEntry.js';
import Overtime from '../models/Overtime.js';
import Leave from '../models/Leave.js';
import Settings from '../models/Settings.js';
import Staff from '../models/Staff.js';
import Site from '../models/Site.js';

/**
 * Calculate payroll for a staff member for a given period
 * @param {ObjectId} staffId - Staff ID
 * @param {Date} periodStart - Period start date
 * @param {Date} periodEnd - Period end date
 * @param {Number} taxPercentage - Tax percentage to apply (0-100)
 * @returns {Object} Payroll calculation breakdown
 */
export const calculatePayroll = async (staffId, periodStart, periodEnd, taxPercentage = 0) => {
    try {
        // Get staff details
        const staff = await Staff.findById(staffId);
        if (!staff) {
            throw new Error('Staff not found');
        }

        // Get settings for OT rate
        const settings = await Settings.getSingleton();

        // Get all approved time entries for the period
        const timeEntries = await TimeEntry.find({
            staffId,
            date: { $gte: periodStart, $lte: periodEnd },
            status: 'Approved',
        });

        // Get all approved overtime for the period
        const overtimeEntries = await Overtime.find({
            staffId,
            date: { $gte: periodStart, $lte: periodEnd },
            status: 'Approved',
        }).populate('siteId');

        // Get all approved leave for the period
        const leaves = await Leave.find({
            staffId,
            startDate: { $lte: periodEnd },
            endDate: { $gte: periodStart },
            status: 'Approved',
        });

        // Calculate normal hours
        const normalHours = timeEntries.reduce((total, entry) => total + entry.totalHours, 0);
        const normalPay = normalHours * staff.hourlyRate;

        // Calculate overtime hours and pay
        let otHours = 0;
        let otPay = 0;

        for (const ot of overtimeEntries) {
            otHours += ot.otHours;

            // Determine OT rate: staff-specific > site-specific > global
            let otRate = settings.globalOtRate;

            if (ot.siteId && ot.siteId.otRate) {
                otRate = ot.siteId.otRate;
            }

            if (staff.otRate) {
                otRate = staff.otRate;
            }

            otPay += ot.otHours * (staff.hourlyRate * otRate);
        }

        // Calculate travel expenses
        const travelExpenses = timeEntries.reduce((total, entry) => {
            if (entry.ownTransport && entry.travelDetails && entry.travelDetails.amount) {
                return total + entry.travelDetails.amount;
            }
            return total;
        }, 0);

        // Calculate leave deductions
        let leaveDeductions = 0;
        for (const leave of leaves) {
            if (leave.leaveType === 'Unpaid') {
                // Deduct based on working hours per day
                const dailyRate = (staff.hourlyRate * settings.workingHoursPerDay);
                leaveDeductions += dailyRate * leave.totalDays;
            }
            // Paid leave doesn't affect salary
        }

        // Calculate gross pay (before tax)
        const grossPay = normalPay + otPay + travelExpenses - leaveDeductions;

        // Calculate tax deduction
        const taxPct = Math.min(Math.max(taxPercentage, 0), 100);
        const taxDeduction = Math.round((grossPay * taxPct) / 100 * 100) / 100;

        // Net pay
        const totalPay = Math.max(0, grossPay - taxDeduction);

        return {
            normalHours,
            normalPay,
            otHours,
            otPay,
            travelExpenses,
            leaveDeductions,
            bonus: 0,
            taxPercentage: taxPct,
            taxDeduction,
            grossPay,
            totalPay,
        };
    } catch (error) {
        throw error;
    }
};

export default calculatePayroll;
