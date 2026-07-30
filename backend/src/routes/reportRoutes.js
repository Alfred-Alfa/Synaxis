import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Staff from '../models/Staff.js';
import TimeEntry from '../models/TimeEntry.js';
import Overtime from '../models/Overtime.js';
import Leave from '../models/Leave.js';
import Site from '../models/Site.js';
import Payroll from '../models/Payroll.js';

const router = express.Router();

// @route   GET /api/reports/staff
// @desc    Get staff report with hours, leave, and performance data
// @access  Private (Admin)
router.get('/staff', protect, authorize('SuperAdmin'), async (req, res) => {
    try {
        const { startDate, endDate, staffId } = req.query;

        const query = {};
        if (staffId) query._id = staffId;

        const staff = await Staff.find(query);

        const reports = await Promise.all(staff.map(async (member) => {
            const timeQuery = { staffId: member._id };
            const leaveQuery = { staffId: member._id };

            if (startDate && endDate) {
                timeQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
                leaveQuery.startDate = { $lte: new Date(endDate) };
                leaveQuery.endDate = { $gte: new Date(startDate) };
            }

            const timeEntries = await TimeEntry.find(timeQuery);
            const overtime = await Overtime.find(timeQuery);
            const leaves = await Leave.find(leaveQuery);

            const totalHours = timeEntries
                .filter(e => e.status === 'Approved')
                .reduce((sum, e) => sum + e.totalHours, 0);

            const totalOtHours = overtime
                .filter(o => o.status === 'Approved')
                .reduce((sum, o) => sum + o.otHours, 0);

            const totalLeaveDays = leaves
                .filter(l => l.status === 'Approved')
                .reduce((sum, l) => sum + l.totalDays, 0);

            return {
                staffId: member._id,
                fullName: member.fullName,
                email: member.email,
                employmentStatus: member.employmentStatus,
                hourlyRate: member.hourlyRate,
                totalHours: totalHours.toFixed(2),
                totalOtHours: totalOtHours.toFixed(2),
                totalLeaveDays,
                totalTimeEntries: timeEntries.length,
                totalOvertimeRequests: overtime.length,
                totalLeaveRequests: leaves.length,
            };
        }));

        res.json({
            success: true,
            data: reports,
            summary: {
                totalStaff: reports.length,
                totalHours: reports.reduce((sum, r) => sum + parseFloat(r.totalHours), 0).toFixed(2),
                totalOtHours: reports.reduce((sum, r) => sum + parseFloat(r.totalOtHours), 0).toFixed(2),
                totalLeaveDays: reports.reduce((sum, r) => sum + r.totalLeaveDays, 0),
            }
        });
    } catch (error) {
        console.error('Staff report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/reports/projects
// @desc    Get project/site report with hours and costs
// @access  Private (Admin)
router.get('/projects', protect, authorize('SuperAdmin'), async (req, res) => {
    try {
        const { startDate, endDate, siteId } = req.query;

        const query = {};
        if (siteId) query._id = siteId;

        const sites = await Site.find(query);

        const reports = await Promise.all(sites.map(async (site) => {
            const timeQuery = { siteId: site._id };
            const otQuery = { siteId: site._id };

            if (startDate && endDate) {
                timeQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
                otQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }

            const timeEntries = await TimeEntry.find(timeQuery).populate('staffId');
            const overtime = await Overtime.find(otQuery).populate('staffId');

            const approvedTimeEntries = timeEntries.filter(e => e.status === 'Approved');
            const approvedOvertime = overtime.filter(o => o.status === 'Approved');

            const totalHours = approvedTimeEntries.reduce((sum, e) => sum + e.totalHours, 0);
            const totalOtHours = approvedOvertime.reduce((sum, o) => sum + o.otHours, 0);

            // Calculate costs
            const laborCost = approvedTimeEntries.reduce((sum, e) => {
                const rate = e.staffId?.hourlyRate || 0;
                return sum + (e.totalHours * rate);
            }, 0);

            const otCost = approvedOvertime.reduce((sum, o) => {
                const rate = o.staffId?.hourlyRate || 0;
                const otRate = site.otRate || o.staffId?.otRate || 1.5;
                return sum + (o.otHours * rate * otRate);
            }, 0);

            const travelCost = approvedTimeEntries.reduce((sum, e) => {
                return sum + (e.travelExpense || 0);
            }, 0);

            return {
                siteId: site._id,
                siteName: site.name,
                client: site.client,
                status: site.status,
                totalHours: totalHours.toFixed(2),
                totalOtHours: totalOtHours.toFixed(2),
                totalEntries: timeEntries.length,
                totalOtRequests: overtime.length,
                laborCost: laborCost.toFixed(2),
                otCost: otCost.toFixed(2),
                travelCost: travelCost.toFixed(2),
                totalCost: (laborCost + otCost + travelCost).toFixed(2),
                uniqueStaff: [...new Set(timeEntries.map(e => e.staffId?._id?.toString()))].length,
            };
        }));

        res.json({
            success: true,
            data: reports,
            summary: {
                totalProjects: reports.length,
                totalHours: reports.reduce((sum, r) => sum + parseFloat(r.totalHours), 0).toFixed(2),
                totalCost: reports.reduce((sum, r) => sum + parseFloat(r.totalCost), 0).toFixed(2),
            }
        });
    } catch (error) {
        console.error('Project report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/reports/attendance
// @desc    Get attendance summary report
// @access  Private (Admin)
router.get('/attendance', protect, authorize('SuperAdmin'), async (req, res) => {
    try {
        const { startDate, endDate, staffId } = req.query;

        const query = {};
        if (staffId) query.staffId = staffId;
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const timeEntries = await TimeEntry.find(query).populate('staffId siteId');

        // Group by staff
        const staffAttendance = {};

        timeEntries.forEach(entry => {
            const staffKey = entry.staffId?._id?.toString();
            if (!staffKey) return;

            if (!staffAttendance[staffKey]) {
                staffAttendance[staffKey] = {
                    staffId: entry.staffId._id,
                    fullName: entry.staffId.fullName,
                    totalDays: 0,
                    totalHours: 0,
                    approvedDays: 0,
                    approvedHours: 0,
                    pendingDays: 0,
                    sites: new Set(),
                };
            }

            staffAttendance[staffKey].totalDays += 1;
            staffAttendance[staffKey].totalHours += entry.totalHours;

            if (entry.status === 'Approved') {
                staffAttendance[staffKey].approvedDays += 1;
                staffAttendance[staffKey].approvedHours += entry.totalHours;
            } else if (entry.status === 'Pending') {
                staffAttendance[staffKey].pendingDays += 1;
            }

            if (entry.siteId) {
                staffAttendance[staffKey].sites.add(entry.siteId.name);
            }
        });

        const reports = Object.values(staffAttendance).map(record => ({
            ...record,
            sites: Array.from(record.sites),
            totalHours: record.totalHours.toFixed(2),
            approvedHours: record.approvedHours.toFixed(2),
            avgHoursPerDay: (record.approvedHours / record.approvedDays || 0).toFixed(2),
        }));

        res.json({
            success: true,
            data: reports,
            summary: {
                totalEntries: timeEntries.length,
                totalStaff: reports.length,
                totalDays: reports.reduce((sum, r) => sum + r.totalDays, 0),
                totalHours: reports.reduce((sum, r) => sum + parseFloat(r.totalHours), 0).toFixed(2),
            }
        });
    } catch (error) {
        console.error('Attendance report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/reports/leave
// @desc    Get leave summary report
// @access  Private (Admin)
router.get('/leave', protect, authorize('SuperAdmin'), async (req, res) => {
    try {
        const { startDate, endDate, staffId, leaveType } = req.query;

        const query = {};
        if (staffId) query.staffId = staffId;
        if (leaveType) query.leaveType = leaveType;

        if (startDate && endDate) {
            query.$or = [
                { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
                { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
            ];
        }

        const leaves = await Leave.find(query).populate('staffId');

        // Group by staff
        const staffLeave = {};

        leaves.forEach(leave => {
            const staffKey = leave.staffId?._id?.toString();
            if (!staffKey) return;

            if (!staffLeave[staffKey]) {
                staffLeave[staffKey] = {
                    staffId: leave.staffId._id,
                    fullName: leave.staffId.fullName,
                    totalRequests: 0,
                    totalDays: 0,
                    approvedDays: 0,
                    rejectedDays: 0,
                    pendingDays: 0,
                    byType: { Paid: 0, Unpaid: 0, Sick: 0, Casual: 0 },
                };
            }

            staffLeave[staffKey].totalRequests += 1;
            staffLeave[staffKey].totalDays += leave.totalDays;

            if (leave.status === 'Approved') {
                staffLeave[staffKey].approvedDays += leave.totalDays;
                staffLeave[staffKey].byType[leave.leaveType] += leave.totalDays;
            } else if (leave.status === 'Rejected') {
                staffLeave[staffKey].rejectedDays += leave.totalDays;
            } else if (leave.status === 'Pending') {
                staffLeave[staffKey].pendingDays += leave.totalDays;
            }
        });

        const reports = Object.values(staffLeave);

        res.json({
            success: true,
            data: reports,
            summary: {
                totalRequests: leaves.length,
                totalDays: reports.reduce((sum, r) => sum + r.totalDays, 0),
                approvedDays: reports.reduce((sum, r) => sum + r.approvedDays, 0),
                byType: {
                    Paid: reports.reduce((sum, r) => sum + r.byType.Paid, 0),
                    Unpaid: reports.reduce((sum, r) => sum + r.byType.Unpaid, 0),
                    Sick: reports.reduce((sum, r) => sum + r.byType.Sick, 0),
                    Casual: reports.reduce((sum, r) => sum + r.byType.Casual, 0),
                }
            }
        });
    } catch (error) {
        console.error('Leave report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/reports/finance
// @desc    Get finance report with payroll, expenses, and revenue
// @access  Private (Admin)
router.get('/finance', protect, authorize('SuperAdmin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateQuery = {};
        if (startDate && endDate) {
            dateQuery.periodStart = { $gte: new Date(startDate) };
            dateQuery.periodEnd = { $lte: new Date(endDate) };
        }

        const payrolls = await Payroll.find(dateQuery).populate('staffId');

        // Calculate payroll costs
        const totalPayroll = payrolls.reduce((sum, p) => sum + p.netPay, 0);
        const totalNormalPay = payrolls.reduce((sum, p) => sum + p.normalPay, 0);
        const totalOtPay = payrolls.reduce((sum, p) => sum + p.otPay, 0);
        const totalTravelExpenses = payrolls.reduce((sum, p) => sum + (p.travelExpense || 0), 0);
        const totalDeductions = payrolls.reduce((sum, p) => sum + (p.unpaidLeaveDeduction || 0), 0);

        // Get time entries for the period for additional analysis
        const timeQuery = {};
        if (startDate && endDate) {
            timeQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const timeEntries = await TimeEntry.find({ ...timeQuery, status: 'Approved' });
        const overtime = await Overtime.find({ ...timeQuery, status: 'Approved' });

        const totalHours = timeEntries.reduce((sum, e) => sum + e.totalHours, 0);
        const totalOtHours = overtime.reduce((sum, o) => sum + o.otHours, 0);

        // By month breakdown
        const byMonth = {};
        payrolls.forEach(p => {
            const month = new Date(p.periodStart).toISOString().slice(0, 7);
            if (!byMonth[month]) {
                byMonth[month] = {
                    month,
                    count: 0,
                    totalPay: 0,
                    normalPay: 0,
                    otPay: 0,
                };
            }
            byMonth[month].count += 1;
            byMonth[month].totalPay += p.netPay;
            byMonth[month].normalPay += p.normalPay;
            byMonth[month].otPay += p.otPay;
        });

        res.json({
            success: true,
            data: {
                totalPayroll: totalPayroll.toFixed(2),
                totalNormalPay: totalNormalPay.toFixed(2),
                totalOtPay: totalOtPay.toFixed(2),
                totalTravelExpenses: totalTravelExpenses.toFixed(2),
                totalDeductions: totalDeductions.toFixed(2),
                totalHours: totalHours.toFixed(2),
                totalOtHours: totalOtHours.toFixed(2),
                payrollCount: payrolls.length,
                avgPayrollPerStaff: payrolls.length > 0 ? (totalPayroll / payrolls.length).toFixed(2) : '0.00',
                byMonth: Object.values(byMonth),
            },
            summary: {
                periodStart: startDate || 'All time',
                periodEnd: endDate || 'All time',
                totalCost: totalPayroll.toFixed(2),
                totalStaffPaid: [...new Set(payrolls.map(p => p.staffId?._id?.toString()))].length,
            }
        });
    } catch (error) {
        console.error('Finance report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
