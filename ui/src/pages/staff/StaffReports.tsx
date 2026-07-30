import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { payrollService } from '../../services/payrollService';
import { Pagination } from '../../components/ui/Pagination';
import './StaffReports.css';

export const StaffReports: React.FC = () => {
    // const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'hours' | 'payment'>('hours');
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const [hoursData, setHoursData] = useState<any>(null);
    const [paymentData, setPaymentData] = useState<any[]>([]);
    
    // Pagination states
    const [entriesPage, setEntriesPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        loadData();
    }, [dateRange, viewMode]);

    useEffect(() => {
        setEntriesPage(1);
        setPaymentsPage(1);
    }, [viewMode, dateRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (viewMode === 'hours') {
                await loadHoursData();
            } else {
                await loadPaymentData();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHoursData = async () => {
        const [timeEntries, overtime] = await Promise.all([
            timeEntryService.getAll({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            }),
            overtimeService.getAll({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            }),
        ]);

        const approvedTimeEntries = (timeEntries.data || []).filter((e: any) => e.status === 'Approved');
        const approvedOvertime = (overtime.data || []).filter((o: any) => o.status === 'Approved');

        const totalHours = approvedTimeEntries.reduce((sum: number, e: any) => sum + e.totalHours, 0);
        const totalOtHours = approvedOvertime.reduce((sum: number, o: any) => sum + o.otHours, 0);
        const totalTravelExpense = approvedTimeEntries.reduce((sum: number, e: any) => sum + (e.travelExpense || 0), 0);

        setHoursData({
            totalEntries: timeEntries.data?.length || 0,
            approvedEntries: approvedTimeEntries.length,
            totalHours: totalHours.toFixed(2),
            totalOtHours: totalOtHours.toFixed(2),
            totalTravelExpense: totalTravelExpense.toFixed(2),
            entries: approvedTimeEntries,
            overtime: approvedOvertime,
        });
    };

    const loadPaymentData = async () => {
        const response = await payrollService.getAll({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
        });

        setPaymentData(response.data || []);
    };

    const downloadPayslip = async (payrollId: string) => {
        try {
            await payrollService.downloadPayslip(payrollId);
        } catch (error) {
            console.error('Failed to download payslip:', error);
            alert('Failed to download payslip');
        }
    };

    if (loading) {
        return <div className="loading">Loading reports...</div>;
    }

    return (
        <div className="staff-reports fade-in">
            <div className="page-header">
                <div>
                    <h1>My Reports</h1>
                    <p className="text-muted">View your hours and payment history</p>
                </div>
            </div>

            <div className="card mb-3">
                <div className="report-controls">
                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('hours')}
                            className={`btn btn-sm ${viewMode === 'hours' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            📊 Hours Summary
                        </button>
                        <button
                            onClick={() => setViewMode('payment')}
                            className={`btn btn-sm ${viewMode === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            💰 Payment History
                        </button>
                    </div>

                    <div className="date-filters">
                        <div className="form-group">
                            <label className="form-label">From</label>
                            <input
                                type="date"
                                className="input"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">To</label>
                            <input
                                type="date"
                                className="input"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'hours' && hoursData && (
                <>
                    <div className="stats-grid mb-3">
                        <div className="stat-card">
                            <div className="stat-value">{hoursData.totalHours}</div>
                            <div className="stat-label">Total Hours</div>
                            <div className="stat-sublabel">{hoursData.approvedEntries} approved entries</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{hoursData.totalOtHours}</div>
                            <div className="stat-label">Overtime Hours</div>
                            <div className="stat-sublabel">{hoursData.overtime.length} OT sessions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">${hoursData.totalTravelExpense}</div>
                            <div className="stat-label">Travel Expenses</div>
                            <div className="stat-sublabel">Approved claims</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{hoursData.totalEntries}</div>
                            <div className="stat-label">Total Entries</div>
                            <div className="stat-sublabel">All submissions</div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="mb-3">Time Entry Details</h3>
                        {hoursData.entries.length === 0 ? (
                            <div className="empty-state">
                                <p>No approved time entries for this period</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Site</th>
                                            <th>Hours</th>
                                            <th>Travel Expense</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hoursData.entries.slice((entriesPage - 1) * itemsPerPage, entriesPage * itemsPerPage).map((entry: any) => (
                                            <tr key={entry._id}>
                                                <td>{new Date(entry.date).toLocaleDateString()}</td>
                                                <td>{typeof entry.siteId === 'object' ? entry.siteId.name : '-'}</td>
                                                <td className="text-primary">
                                                    <strong>{entry.totalHours.toFixed(2)} hrs</strong>
                                                </td>
                                                <td>${(entry.travelExpense || 0).toFixed(2)}</td>
                                                <td>{entry.jobDescription}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {hoursData.entries && hoursData.entries.length > 0 && (
                            <Pagination 
                                currentPage={entriesPage}
                                totalItems={hoursData.entries.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setEntriesPage}
                            />
                        )}
                    </div>
                </>
            )}

            {viewMode === 'payment' && (
                <div className="card">
                    <h3 className="mb-3">Payment History</h3>
                    {paymentData.length === 0 ? (
                        <div className="empty-state">
                            <p>No payment records for this period</p>
                        </div>
                    ) : (
                        <>
                            <div className="payment-summary mb-3">
                                <div className="summary-item">
                                    <span className="summary-label">Total Payments:</span>
                                    <span className="summary-value">
                                        ${paymentData.reduce((sum, p) => sum + p.netPay, 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Total Hours:</span>
                                    <span className="summary-value">
                                        {paymentData.reduce((sum, p) => sum + p.normalHours, 0).toFixed(2)} hrs
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Total OT Hours:</span>
                                    <span className="summary-value">
                                        {paymentData.reduce((sum, p) => sum + p.otHours, 0).toFixed(2)} hrs
                                    </span>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Period</th>
                                            <th>Normal Hours</th>
                                            <th>OT Hours</th>
                                            <th>Normal Pay</th>
                                            <th>OT Pay</th>
                                            <th>Travel</th>
                                            <th>Net Pay</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentData.slice((paymentsPage - 1) * itemsPerPage, paymentsPage * itemsPerPage).map((payroll: any) => (
                                            <tr key={payroll._id}>
                                                <td>
                                                    <div>{new Date(payroll.periodStart).toLocaleDateString()}</div>
                                                    <div className="text-muted text-sm">
                                                        to {new Date(payroll.periodEnd).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td>{payroll.normalHours.toFixed(2)}</td>
                                                <td>{payroll.otHours.toFixed(2)}</td>
                                                <td>${payroll.normalPay.toFixed(2)}</td>
                                                <td>${payroll.otPay.toFixed(2)}</td>
                                                <td>${(payroll.travelExpense || 0).toFixed(2)}</td>
                                                <td className="text-primary">
                                                    <strong>${payroll.netPay.toFixed(2)}</strong>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${payroll.isPaid ? 'success' : 'warning'}`}>
                                                        {payroll.isPaid ? 'Paid' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => downloadPayslip(payroll._id)}
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        📥 Payslip
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {paymentData.length > 0 && (
                                <Pagination 
                                    currentPage={paymentsPage}
                                    totalItems={paymentData.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setPaymentsPage}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
