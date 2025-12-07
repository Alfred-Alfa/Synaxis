import React, { useState } from 'react';
import { staffService } from '../../services/staffService';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { leaveService } from '../../services/leaveService';
import './Reports.css';

export const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<'staff' | 'timesheet' | 'overtime' | 'leave'>('staff');
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
                    const staffRes = await staffService.getAll();
                    data = processStaffReport(staffRes.data || []);
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
            }

            setReportData(data);
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const processStaffReport = (staff: any[]) => {
        const active = staff.filter(s => s.employmentStatus === 'Active').length;
        const inactive = staff.filter(s => s.employmentStatus === 'Inactive').length;

        return {
            total: staff.length,
            active,
            inactive,
            avgHourlyRate: (staff.reduce((sum, s) => sum + (s.hourlyRate || 0), 0) / staff.length).toFixed(2),
            details: staff,
        };
    };

    const processTimesheetReport = (entries: any[]) => {
        const totalHours = entries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
        const approved = entries.filter(e => e.status === 'Approved');
        const pending = entries.filter(e => e.status === 'Pending');

        return {
            total: entries.length,
            totalHours: totalHours.toFixed(2),
            approved: approved.length,
            pending: pending.length,
            approvedHours: approved.reduce((sum, e) => sum + (e.totalHours || 0), 0).toFixed(2),
            details: entries,
        };
    };

    const processOvertimeReport = (overtime: any[]) => {
        const totalOtHours = overtime.reduce((sum, o) => sum + (o.otHours || 0), 0);
        const approved = overtime.filter(o => o.status === 'Approved');

        return {
            total: overtime.length,
            totalOtHours: totalOtHours.toFixed(2),
            approved: approved.length,
            approvedOtHours: approved.reduce((sum, o) => sum + (o.otHours || 0), 0).toFixed(2),
            details: overtime,
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

        return {
            total: leaves.length,
            totalDays,
            approved: leaves.filter(l => l.status === 'Approved').length,
            byType,
            details: leaves,
        };
    };

    const exportToCSV = () => {
        if (!reportData?.details) return;

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
                        </select>
                    </div>
                </div>

                <div className="action-buttons mt-3">
                    <button
                        onClick={generateReport}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : '📊 Generate Report'}
                    </button>
                </div>
            </div>

            {reportData && (
                <>
                    <div className="card mb-3">
                        <div className="report-header">
                            <h3>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Summary</h3>
                            <div className="action-buttons">
                                <button onClick={exportToCSV} className="btn btn-secondary btn-sm">
                                    📥 Export CSV
                                </button>
                                <button onClick={printReport} className="btn btn-secondary btn-sm">
                                    🖨️ Print
                                </button>
                            </div>
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
                                        <div className="stat-value">{reportData.inactive}</div>
                                        <div className="stat-label">Inactive</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">${reportData.avgHourlyRate}</div>
                                        <div className="stat-label">Avg Hourly Rate</div>
                                    </div>
                                </>
                            )}

                            {reportType === 'timesheet' && (
                                <>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.total}</div>
                                        <div className="stat-label">Total Entries</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.totalHours} hrs</div>
                                        <div className="stat-label">Total Hours</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.approved}</div>
                                        <div className="stat-label">Approved</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.approvedHours} hrs</div>
                                        <div className="stat-label">Approved Hours</div>
                                    </div>
                                </>
                            )}

                            {reportType === 'overtime' && (
                                <>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.total}</div>
                                        <div className="stat-label">Total OT Requests</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.totalOtHours} hrs</div>
                                        <div className="stat-label">Total OT Hours</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.approved}</div>
                                        <div className="stat-label">Approved</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.approvedOtHours} hrs</div>
                                        <div className="stat-label">Approved OT Hours</div>
                                    </div>
                                </>
                            )}

                            {reportType === 'leave' && (
                                <>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.total}</div>
                                        <div className="stat-label">Total Requests</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.totalDays}</div>
                                        <div className="stat-label">Total Days</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">{reportData.approved}</div>
                                        <div className="stat-label">Approved</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-value">
                                            Paid: {reportData.byType.Paid} | Sick: {reportData.byType.Sick}
                                        </div>
                                        <div className="stat-label">By Type</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {reportType === 'leave' && reportData.byType && (
                        <div className="card mb-3">
                            <h3 className="mb-3">Leave Distribution</h3>
                            <div className="chart-container">
                                <div className="bar-chart">
                                    {Object.entries(reportData.byType).map(([type, count]: [string, any]) => (
                                        <div key={type} className="bar-item">
                                            <div className="bar-label">{type}</div>
                                            <div className="bar-wrapper">
                                                <div
                                                    className={`bar bar-${type.toLowerCase()}`}
                                                    style={{
                                                        width: `${(count / reportData.total) * 100}%`,
                                                    }}
                                                >
                                                    {count}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <h3 className="mb-3">Detailed Data ({reportData.details?.length || 0} records)</h3>
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        {reportData.details && reportData.details[0] &&
                                            Object.keys(reportData.details[0]).slice(0, 8).map((key: string) => (
                                                <th key={key}>{key}</th>
                                            ))
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.details?.slice(0, 50).map((row: any, idx: number) => (
                                        <tr key={idx}>
                                            {Object.values(row).slice(0, 8).map((val: any, i: number) => (
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
