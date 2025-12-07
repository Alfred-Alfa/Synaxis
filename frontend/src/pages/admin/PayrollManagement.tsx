import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { staffService } from '../../services/staffService';
import type { Payroll, Staff } from '../../types';
import { PayrollGenerateModal } from '../../components/forms/PayrollGenerateModal';
import { EditPayrollModal } from '../../components/forms/EditPayrollModal';
import { Filter, Calendar, X, Download, CheckCircle, FileText, Clock, Trash2, Edit } from 'lucide-react';
import './AdminTimeEntry.css';

export const PayrollManagement: React.FC = () => {
    const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);

    // Filter states
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | ''>('');

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedMonth]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedYear) params.year = selectedYear;
            if (selectedMonth) params.month = selectedMonth;

            const [payrollRes, staffRes] = await Promise.all([
                payrollService.getAll(params),
                staffService.getAll({ status: 'Active' }),
            ]);
            setPayrollRecords(payrollRes.data || []);
            setStaff(staffRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load payroll data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        setShowModal(true);
    };

    const handleDownloadPayslip = async (id: string) => {
        try {
            const blob = await payrollService.downloadPayslip(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to download payslip');
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        if (!window.confirm('Mark this payroll as paid?')) {
            return;
        }

        try {
            await payrollService.markAsPaid(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to mark as paid');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this payroll record? This action cannot be undone.')) {
            return;
        }

        try {
            await payrollService.delete(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete payroll record');
        }
    };

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        if (success) {
            loadData();
        }
    };

    const handleEditClose = (success?: boolean) => {
        setEditingPayroll(null);
        if (success) {
            loadData();
        }
    };

    const getStaffName = (staffId: string | Staff) => {
        if (typeof staffId === 'object') return staffId.fullName;
        const staffMember = staff.find(s => s._id === staffId);
        return staffMember?.fullName || 'Unknown';
    };

    // Generate year options (current year - 2 to current year + 1)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    if (loading && !payrollRecords.length) {
        return <div className="loading">Loading payroll records...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Payroll History</h1>
                    <p className="text-muted">Manage monthly payrolls and payments</p>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} />
                    Generate Payroll
                </button>
            </div>

            {error && (
                <div className="error-alert mb-3">
                    {error}
                </div>
            )}

            <div className="card">
                <div className="filter-bar" style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                        <Filter size={18} />
                        <span style={{ fontWeight: 500 }}>Filters:</span>
                    </div>

                    <div className="select-wrapper">
                        <select
                            className="select"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            style={{ width: '120px' }}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="select-wrapper">
                        <select
                            className="select"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
                            style={{ width: '150px' }}
                        >
                            <option value="">All Months</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {(selectedMonth !== '' || selectedYear !== currentYear) && (
                        <button
                            onClick={() => {
                                setSelectedYear(currentYear);
                                setSelectedMonth('');
                            }}
                            className="btn btn-text"
                            style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <X size={16} />
                            Reset
                        </button>
                    )}
                </div>

                <div className="entry-count mb-3">
                    <strong>{payrollRecords.length}</strong> payroll records found
                    {selectedMonth && ` for ${months.find(m => m.value === selectedMonth)?.label}`} {selectedYear}
                </div>

                {payrollRecords.length === 0 ? (
                    <div className="empty-state">
                        <p>No payroll records found for this period</p>
                        <button onClick={handleGenerate} className="btn btn-primary mt-2">
                            Generate Payroll
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Pay Period</th>
                                    <th>Breakdown</th>
                                    <th>Total Pay</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollRecords.map((payroll) => (
                                    <tr key={payroll._id}>
                                        <td>
                                            <div style={{ fontWeight: 500, color: '#0f172a' }}>{getStaffName(payroll.staffId)}</div>
                                            <div className="text-muted text-sm" style={{ fontSize: '0.85rem' }}>
                                                {typeof payroll.staffId === 'object' ? payroll.staffId.email : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} className="text-muted" />
                                                <span className="text-sm">
                                                    {new Date(payroll.periodStart).toLocaleDateString()} - {new Date(payroll.periodEnd).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div>Normal: {payroll.normalHours.toFixed(1)}h</div>
                                                {payroll.otHours > 0 && (
                                                    <div style={{ color: '#d97706' }}>OT: {payroll.otHours.toFixed(1)}h (${payroll.otPay.toFixed(2)})</div>
                                                )}
                                                {payroll.travelExpenses > 0 && (
                                                    <div style={{ color: '#059669' }}>Travel: +${payroll.travelExpenses.toFixed(2)}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                                                ${payroll.totalPay.toFixed(2)}
                                            </div>
                                            {payroll.leaveDeductions > 0 && (
                                                <div className="text-danger text-sm">-${payroll.leaveDeductions.toFixed(2)} deductions</div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${payroll.isPaid ? 'success' : 'warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                {payroll.isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                {payroll.isPaid ? 'Paid' : 'Pending'}
                                            </span>
                                            {payroll.isPaid && payroll.paidAt && (
                                                <div className="text-sm text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                                    {new Date(payroll.paidAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => handleDownloadPayslip(payroll._id)}
                                                    className="btn btn-secondary btn-sm"
                                                    title="Download Payslip"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                >
                                                    <Download size={14} />
                                                </button>

                                                <button
                                                    onClick={() => setEditingPayroll(payroll)}
                                                    className="btn btn-secondary btn-sm"
                                                    title="Edit Record"
                                                >
                                                    <Edit size={14} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(payroll._id)}
                                                    className="btn btn-danger btn-sm"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                                {!payroll.isPaid && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(payroll._id)}
                                                        className="btn btn-success btn-sm"
                                                        title="Mark as Paid"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <PayrollGenerateModal
                    staff={staff}
                    onClose={handleModalClose}
                />
            )}

            {editingPayroll && (
                <EditPayrollModal
                    payroll={editingPayroll}
                    staffName={getStaffName(editingPayroll.staffId)}
                    onClose={handleEditClose}
                />
            )}
        </div>
    );
};
