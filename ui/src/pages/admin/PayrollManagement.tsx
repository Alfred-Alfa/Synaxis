import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { staffService } from '../../services/staffService';
import type { Payroll, Staff } from '../../types';
import { PayrollGenerateModal } from '../../components/forms/PayrollGenerateModal';
import { EditPayrollModal } from '../../components/forms/EditPayrollModal';
import { Filter, Calendar, X, CheckCircle, FileText, Clock, Trash2, Edit, Send, Share2 } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import './AdminTimeEntry.css';
import { settingsService } from '../../services/settingsService';

export const PayrollManagement: React.FC = () => {
    const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
    const [currencySymbol, setCurrencySymbol] = useState('$');

    // Filter states
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        loadData();
        setCurrentPage(1);
    }, [selectedYear, selectedMonth]);

    const getCurrencySymbol = (currencyCode: string) => {
        const symbols: Record<string, string> = {
            USD: '$', GBP: '£', EUR: '€', INR: '₹', SGD: 'S$', AUD: 'A$', CAD: 'C$', AED: 'AED '
        };
        return symbols[currencyCode] || currencyCode;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedYear) params.year = selectedYear;
            if (selectedMonth) params.month = selectedMonth;

            const [payrollRes, staffRes, settingsRes] = await Promise.all([
                payrollService.getAll(params),
                staffService.getAll({ status: 'Active' }),
                settingsService.get(),
            ]);
            setPayrollRecords(payrollRes.data || []);
            setStaff(staffRes.data || []);
            if (settingsRes.data?.currency) {
                setCurrencySymbol(getCurrencySymbol(settingsRes.data.currency));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load payroll data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        setShowModal(true);
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

    const handleShareWithEmployee = async (id: string) => {
        if (!window.confirm('Share this payslip with the employee? They will receive a notification and be able to view/download it.')) {
            return;
        }

        try {
            await payrollService.shareWithEmployee(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to share payslip');
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

    const getStaffName = (staffId: string | Staff | null | undefined) => {
        if (!staffId) return 'Unknown Staff';
        if (typeof staffId === 'object') return staffId.fullName || 'Unknown Staff';
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

    const paginatedPayroll = payrollRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading && !payrollRecords.length) {
        return <div className="loading">Loading payroll records...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Payroll Management</h1>
                    <p className="text-muted">Generate, manage and share payslips with employees</p>
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
                                    <th>Working Hours</th>
                                    <th>Breakdown</th>
                                    <th>Net Pay</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPayroll.map((payroll) => (
                                    <tr key={payroll._id}>
                                        <td>
                                            <div style={{ fontWeight: 500, color: '#0f172a' }}>{getStaffName(payroll.staffId)}</div>
                                            <div className="text-muted text-sm" style={{ fontSize: '0.85rem' }}>
                                                {payroll.staffId && typeof payroll.staffId === 'object' ? payroll.staffId.email : ''}
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Clock size={12} style={{ color: '#3b82f6' }} />
                                                    <span><strong>{payroll.normalHours.toFixed(1)}</strong>h regular</span>
                                                </div>
                                                {payroll.otHours > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d97706' }}>
                                                        <Clock size={12} />
                                                        <span><strong>{payroll.otHours.toFixed(1)}</strong>h overtime</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div style={{ fontWeight: 500 }}>
                                                    Regular: {currencySymbol}{payroll.normalPay.toFixed(2)}
                                                    <span className="text-muted" style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                                                        ({payroll.normalHours.toFixed(1)}h × {currencySymbol}{(payroll.normalHours > 0 ? (payroll.normalPay / payroll.normalHours).toFixed(1) : 0)}/h)
                                                    </span>
                                                </div>

                                                {payroll.otPay > 0 && (
                                                    <div style={{ color: '#d97706', fontWeight: 500 }}>
                                                        OT: {currencySymbol}{payroll.otPay.toFixed(2)}
                                                        <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem', opacity: 0.8 }}>
                                                            ({payroll.otHours.toFixed(1)}h × {currencySymbol}{(payroll.otHours > 0 ? (payroll.otPay / payroll.otHours).toFixed(1) : 0)}/h)
                                                        </span>
                                                    </div>
                                                )}
                                                {payroll.travelExpenses > 0 && (
                                                    <div style={{ color: '#059669' }}>Travel: +{currencySymbol}{payroll.travelExpenses.toFixed(2)}</div>
                                                )}
                                                {payroll.bonus > 0 && (
                                                    <div style={{ color: '#059669' }}>Bonus: +{currencySymbol}{payroll.bonus.toFixed(2)}</div>
                                                )}
                                                {payroll.leaveDeductions > 0 && (
                                                    <div style={{ color: '#dc2626' }}>Leave: -{currencySymbol}{payroll.leaveDeductions.toFixed(2)}</div>
                                                )}
                                                {(payroll.taxDeduction > 0 || payroll.taxPercentage > 0) && (
                                                    <div style={{ color: '#7c3aed' }}>Tax ({payroll.taxPercentage}%): -{currencySymbol}{payroll.taxDeduction.toFixed(2)}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                                                {currencySymbol}{payroll.totalPay.toFixed(2)}
                                            </div>
                                            {payroll.grossPay > 0 && payroll.grossPay !== payroll.totalPay && (
                                                <div className="text-muted text-sm" style={{ fontSize: '0.75rem' }}>
                                                    Gross: {currencySymbol}{payroll.grossPay.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span className={`badge badge-${payroll.isPaid ? 'success' : 'warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {payroll.isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                    {payroll.isPaid ? 'Paid' : 'Pending'}
                                                </span>
                                                {payroll.isSharedWithEmployee ? (
                                                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', background: '#dbeafe', color: '#1d4ed8' }}>
                                                        <Share2 size={10} /> Shared
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Not shared</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>




                                                {!payroll.isSharedWithEmployee && (
                                                    <button
                                                        onClick={() => handleShareWithEmployee(payroll._id)}
                                                        className="btn btn-sm"
                                                        title="Share with Employee"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '0.35rem 0.6rem', cursor: 'pointer' }}
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                )}

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
                {payrollRecords.length > 0 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={payrollRecords.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
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
