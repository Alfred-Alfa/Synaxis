import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { staffService } from '../../services/staffService';
import type { Payroll, Staff } from '../../types';
import { PayrollGenerateModal } from '../../components/forms/PayrollGenerateModal';
import './AdminTimeEntry.css';

export const PayrollManagement: React.FC = () => {
    const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [payrollRes, staffRes] = await Promise.all([
                payrollService.getAll(),
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

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        if (success) {
            loadData();
        }
    };

    const getStaffName = (staffId: string | Staff) => {
        if (typeof staffId === 'object') return staffId.fullName;
        const staffMember = staff.find(s => s._id === staffId);
        return staffMember?.fullName || 'Unknown';
    };

    if (loading) {
        return <div className="loading">Loading payroll records...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Payroll Management</h1>
                    <p className="text-muted">Generate payroll and manage payments</p>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary">
                    + Generate Payroll
                </button>
            </div>

            {error && (
                <div className="error-alert mb-3">
                    {error}
                </div>
            )}

            <div className="card">
                <div className="entry-count mb-3">
                    <strong>{payrollRecords.length}</strong> payroll records found
                </div>

                {payrollRecords.length === 0 ? (
                    <div className="empty-state">
                        <p>No payroll records found</p>
                        <button onClick={handleGenerate} className="btn btn-primary mt-2">
                            Generate First Payroll
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Staff</th>
                                    <th>Period</th>
                                    <th>Normal Hours</th>
                                    <th>OT Hours</th>
                                    <th>Travel</th>
                                    <th>Deductions</th>
                                    <th>Total Pay</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollRecords.map((payroll) => (
                                    <tr key={payroll._id}>
                                        <td>
                                            <div className="staff-name">{getStaffName(payroll.staffId)}</div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {new Date(payroll.periodStart).toLocaleDateString()}
                                            </div>
                                            <div className="text-muted text-sm">to</div>
                                            <div className="text-sm">
                                                {new Date(payroll.periodEnd).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div>{payroll.normalHours.toFixed(2)} hrs</div>
                                            <div className="text-muted text-sm">${payroll.normalPay.toFixed(2)}</div>
                                        </td>
                                        <td>
                                            <div>{payroll.otHours.toFixed(2)} hrs</div>
                                            <div className="text-muted text-sm">${payroll.otPay.toFixed(2)}</div>
                                        </td>
                                        <td className="text-success">
                                            ${payroll.travelExpenses.toFixed(2)}
                                        </td>
                                        <td className="text-danger">
                                            ${payroll.leaveDeductions.toFixed(2)}
                                        </td>
                                        <td className="text-primary">
                                            <strong>${payroll.totalPay.toFixed(2)}</strong>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${payroll.isPaid ? 'success' : 'warning'}`}>
                                                {payroll.isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                            {payroll.isPaid && payroll.paidAt && (
                                                <div className="text-sm text-muted mt-1">
                                                    {new Date(payroll.paidAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleDownloadPayslip(payroll._id)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    📄 Payslip
                                                </button>
                                                {!payroll.isPaid && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(payroll._id)}
                                                        className="btn btn-success btn-sm"
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
        </div>
    );
};
