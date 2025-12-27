import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { staffService } from '../../services/staffService';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { leaveService } from '../../services/leaveService';
import { payrollService } from '../../services/payrollService';
import { siteService } from '../../services/siteService';
import './Reports.css';

export const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<'staff' | 'timesheet' | 'overtime' | 'leave' | 'site' | 'finance'>('staff');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        staffId: '',
        status: 'all',
    });

    const generateReport = async () => {
        setLoading(true);
        try {
            let data;
            const params: any = {};

            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.staffId) params.staffId = filters.staffId;
            if (filters.status !== 'all') params.status = filters.status;

            switch (reportType) {
                case 'staff':
                    const [staffRes, payrollRes] = await Promise.all([
                        staffService.getAll(),
                        payrollService.getAll(params)
                    ]);
                    data = processStaffReport(staffRes.data || [], payrollRes.data || []);
                    break;
                case 'timesheet':
                    const timeRes = await timeEntryService.getAll(params);
                    data = processTimesheetReport(timeRes.data || []);
                    break;
                case 'overtime':
                    const otRes = await overtimeService.getAll(params);
                    data = processOvertimeReport(otRes.data || []);
                    break;
                case 'leave':
                    const leaveRes = await leaveService.getAll(params);
                    data = processLeaveReport(leaveRes.data || []);
                    break;
                case 'site':
                    const [siteParamsTimeRes, sitesRes, staffListRes] = await Promise.all([
                        timeEntryService.getAll(params),
                        siteService.getAll(),
                        staffService.getAll()
                    ]);
                    // Create staff map for hourly rates
                    const staffMap = new Map();
                    if (staffListRes.data) {
                        staffListRes.data.forEach((s: any) => staffMap.set(s._id, s.hourlyRate));
                    }
                    data = processSiteReport(siteParamsTimeRes.data || [], sitesRes.data || [], staffMap);
                    break;
                case 'finance':
                    const financePayrollRes = await payrollService.getAll(params);
                    data = processFinanceReport(financePayrollRes.data || []);
                    break;
            }

            setReportData(data);
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const processStaffReport = (staff: any[], payrolls: any[]) => {
        const active = staff.filter(s => s.employmentStatus === 'Active').length;
        const inactive = staff.filter(s => s.employmentStatus === 'Inactive').length;

        const staffDetails = staff.map(s => {
            const staffPayrolls = payrolls.filter(p =>
                (p.staffId?._id === s._id) || (p.staffId === s._id)
            );

            const totalHours = staffPayrolls.reduce((sum, p) => sum + (p.normalHours || 0), 0);
            const totalOtHours = staffPayrolls.reduce((sum, p) => sum + (p.otHours || 0), 0);
            const totalSalary = staffPayrolls.reduce((sum, p) => sum + (p.totalPay || 0), 0);
            const totalExpenses = staffPayrolls.reduce((sum, p) => sum + (p.travelExpenses || 0), 0);

            return {
                name: s.fullName,
                email: s.email,
                role: s.designation || 'N/A',
                status: s.employmentStatus,
                totalHours: totalHours.toFixed(2),
                otHours: totalOtHours.toFixed(2),
                earnings: totalSalary.toFixed(2),
                expenses: totalExpenses.toFixed(2)
            };
        });

        return {
            total: staff.length,
            active,
            inactive,
            avgHourlyRate: (staff.reduce((sum, s) => sum + (s.hourlyRate || 0), 0) / (staff.length || 1)).toFixed(2),
            details: staffDetails,
        };
    };

    const processTimesheetReport = (entries: any[]) => {
        const totalHours = entries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
        const approved = entries.filter(e => e.status === 'Approved');
        const pending = entries.filter(e => e.status === 'Pending');

        const details = entries.map(e => ({
            date: new Date(e.date).toLocaleDateString(),
            staff: e.staffId?.fullName || 'Unknown',
            site: e.siteId?.name || 'Unknown',
            hours: e.totalHours,
            status: e.status,
            description: e.jobDescription
        }));

        return {
            total: entries.length,
            totalHours: totalHours.toFixed(2),
            approved: approved.length,
            pending: pending.length,
            approvedHours: approved.reduce((sum, e) => sum + (e.totalHours || 0), 0).toFixed(2),
            details: details,
        };
    };

    const processOvertimeReport = (overtime: any[]) => {
        const totalOtHours = overtime.reduce((sum, o) => sum + (o.otHours || 0), 0);
        const approved = overtime.filter(o => o.status === 'Approved');

        const details = overtime.map(o => ({
            date: new Date(o.date).toLocaleDateString(),
            staff: o.staffId?.fullName || o.staffId || 'Unknown',
            site: o.siteId?.name || o.siteId || 'Unknown',
            hours: o.otHours,
            rate: o.otRate,
            amount: (o.otHours * (o.otRate || 0)).toFixed(2),
            status: o.status,
            reason: o.reason
        }));

        return {
            total: overtime.length,
            totalOtHours: totalOtHours.toFixed(2),
            approved: approved.length,
            approvedOtHours: approved.reduce((sum, o) => sum + (o.otHours || 0), 0).toFixed(2),
            details: details,
        };
    };

    const processLeaveReport = (leaves: any[]) => {
        const totalDays = leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
        const byType = {
            Paid: leaves.filter(l => l.leaveType === 'Paid').length,
            Unpaid: leaves.filter(l => l.leaveType === 'Unpaid').length,
            Sick: leaves.filter(l => l.leaveType === 'Sick').length,
            Casual: leaves.filter(l => l.leaveType === 'Casual').length,
        };

        const details = leaves.map(l => ({
            staff: l.staffId?.fullName || 'Unknown',
            type: l.leaveType,
            startDate: new Date(l.startDate).toLocaleDateString(),
            endDate: new Date(l.endDate).toLocaleDateString(),
            days: l.totalDays,
            status: l.status,
            reason: l.reason
        }));

        return {
            total: leaves.length,
            totalDays,
            approved: leaves.filter(l => l.status === 'Approved').length,
            byType,
            details: details,
        };
    };

    const processSiteReport = (timeEntries: any[], sites: any[], staffMap: Map<string, number>) => {
        const siteStats: any = {};

        // Initialize with all sites
        sites.forEach(site => {
            siteStats[site._id] = {
                name: site.name,
                location: site.location,
                totalHours: 0,
                totalCost: 0,
                entries: 0
            };
        });

        timeEntries.forEach(entry => {
            const siteId = typeof entry.siteId === 'object' ? entry.siteId?._id : entry.siteId;
            const staffId = typeof entry.staffId === 'object' ? entry.staffId?._id : entry.staffId;
            const staffRate = staffMap.get(staffId) || 0;
            const travelCost = entry.travelDetails?.amount || 0;

            if (siteStats[siteId] && entry.status !== 'Rejected') {
                siteStats[siteId].totalHours += (entry.totalHours || 0);
                siteStats[siteId].totalCost += ((entry.totalHours || 0) * staffRate) + travelCost;
                siteStats[siteId].entries += 1;
            }
        });

        const details = Object.values(siteStats).map((s: any) => ({
            site: s.name,
            location: s.location || 'N/A',
            totalHours: s.totalHours.toFixed(2),
            totalCost: s.totalCost.toFixed(2),
            entries: s.entries
        }));

        return {
            totalSites: sites.length,
            activeSites: details.filter((d: any) => parseFloat(d.totalHours) > 0).length,
            totalHours: details.reduce((sum, d: any) => sum + parseFloat(d.totalHours), 0).toFixed(2),
            totalCost: details.reduce((sum, d: any) => sum + parseFloat(d.totalCost), 0).toFixed(2),
            details: details
        };
    }

    const processFinanceReport = (payrolls: any[]) => {
        const totalPaid = payrolls.reduce((sum, p) => sum + (p.totalPay || 0), 0);
        const totalOtPay = payrolls.reduce((sum, p) => sum + (p.otPay || 0), 0);
        const totalExpenses = payrolls.reduce((sum, p) => sum + (p.travelExpenses || 0), 0);
        const totalDeductions = payrolls.reduce((sum, p) => sum + (p.leaveDeductions || 0), 0);

        const details = payrolls.map(p => ({
            periodStart: new Date(p.periodStart).toLocaleDateString(),
            periodEnd: new Date(p.periodEnd).toLocaleDateString(),
            staff: p.staffId?.fullName || 'Unknown',
            normalPay: (p.normalPay || 0).toFixed(2),
            otPay: (p.otPay || 0).toFixed(2),
            expenses: (p.travelExpenses || 0).toFixed(2),
            deductions: (p.leaveDeductions || 0).toFixed(2),
            totalPay: (p.totalPay || 0).toFixed(2),
            status: p.isPaid ? 'Paid' : 'Unpaid'
        }));

        return {
            totalRecords: payrolls.length,
            totalPaid: totalPaid.toFixed(2),
            totalOtPay: totalOtPay.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            totalDeductions: totalDeductions.toFixed(2),
            details: details
        };
    }

    const exportToCSV = () => {
        if (!reportData?.details?.length) return;

        const headers = Object.keys(reportData.details[0] || {}).join(',');
        const rows = reportData.details.map((item: any) =>
            Object.values(item).map(v => `"${v}"`).join(',')
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportToPDF = () => {
        if (!reportData?.details?.length) return;

        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
        doc.text(dateStr, 14, 30);

        // Add Filters Info
        let filterText = '';
        if (filters.startDate) filterText += `From: ${filters.startDate} `;
        if (filters.endDate) filterText += `To: ${filters.endDate}`;
        if (filterText) doc.text(filterText, 14, 36);

        // Add Summary Stats
        let startY = 45;
        if (reportType === 'site') {
            doc.text(`Total Cost: $${reportData.totalCost}`, 14, startY);
            doc.text(`Total Hours: ${reportData.totalHours}`, 80, startY);
            startY += 10;
        } else if (reportType === 'finance') {
            doc.text(`Total Paid: $${reportData.totalPaid}`, 14, startY);
            doc.text(`Expenses: $${reportData.totalExpenses}`, 80, startY);
            startY += 10;
        }

        // Add Table
        const headers = Object.keys(reportData.details[0]).map(h => h.toUpperCase());
        const data = reportData.details.map((row: any) => Object.values(row));

        autoTable(doc, {
            head: [headers],
            body: data,
            startY: startY,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 },
        });

        doc.save(`${reportType}-report.pdf`);
    };

    const printReport = () => {
        window.print();
    };

    return (
        <div className="reports-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p className="text-muted">Generate and export various reports</p>
                </div>
            </div>

            <div className="card mb-3">
                <h3 className="mb-3">Report Configuration</h3>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Report Type *</label>
                        <select
                            className="select"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value as any)}
                        >
                            <option value="staff">Staff Report</option>
                            <option value="timesheet">Timesheet Report</option>
                            <option value="overtime">Overtime Report</option>
                            <option value="leave">Leave Report</option>
                            <option value="site">Site Report</option>
                            <option value="finance">Finance Report</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input
                            type="date"
                            className="input"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input
                            type="date"
                            className="input"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status Filter</label>
                        <select
                            className="select"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="all">All Status</option>
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                    </div>
                </div>

                <div className="action-buttons mt-3" style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={generateReport}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : '📊 Generate Report'}
                    </button>
                    {reportData && (
                        <>
                            <button onClick={exportToPDF} className="btn btn-secondary">
                                📄 Download PDF
                            </button>
                            <button onClick={exportToCSV} className="btn btn-secondary">
                                📥 Download CSV
                            </button>
                            <button onClick={printReport} className="btn btn-secondary">
                                🖨️ Print
                            </button>
                        </>
                    )}
                </div>
            </div>

            {reportData && (
                <>
                    <div className="card mb-3">
                        <div className="report-header">
                            <h3>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Summary</h3>

                        </div>

                        <div className="report-stats">
                            {reportType === 'staff' && (
                                <>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.total}</div>
                                        <div className="stat-label">Total Staff</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.active}</div>
                                        <div className="stat-label">Active</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">${reportData.avgHourlyRate}</div>
                                        <div className="stat-label">Avg Hourly Rate</div>
                                    </div>
                                </>
                            )}

                            {reportType === 'site' && (
                                <>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.totalSites}</div>
                                        <div className="stat-label">Total Sites</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.activeSites}</div>
                                        <div className="stat-label">Active Sites</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.totalHours}</div>
                                        <div className="stat-label">Total Hours</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">${reportData.totalCost}</div>
                                        <div className="stat-label">Total Cost</div>
                                    </div>
                                </>
                            )}

                            {reportType === 'finance' && (
                                <>
                                    <div className="stat-box">
                                        <div className="stat-value">${reportData.totalPaid}</div>
                                        <div className="stat-label">Total Salaries</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">${reportData.totalOtPay}</div>
                                        <div className="stat-label">Total OT Paid</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">${reportData.totalExpenses}</div>
                                        <div className="stat-label">Total Expenses</div>
                                    </div>
                                </>
                            )}

                            {(reportType === 'timesheet' || reportType === 'overtime' || reportType === 'leave') && (
                                <div className="stat-box">
                                    <div className="stat-value">{reportData.total}</div>
                                    <div className="stat-label">Total Records</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="mb-3">Detailed Data ({reportData.details?.length || 0} records)</h3>
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        {reportData.details && reportData.details[0] &&
                                            Object.keys(reportData.details[0]).map((key: string) => (
                                                <th key={key}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</th>
                                            ))
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.details?.slice(0, 50).map((row: any, idx: number) => (
                                        <tr key={idx}>
                                            {Object.values(row).map((val: any, i: number) => (
                                                <td key={i}>{typeof val === 'object' ? JSON.stringify(val).slice(0, 50) : String(val).slice(0, 100)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {reportData.details?.length > 50 && (
                            <p className="text-muted text-center mt-3">
                                Showing first 50 of {reportData.details.length} records. Export to see all data.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
