import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { payrollService } from '../../services/payrollService';
import type { Payroll } from '../../types';
import {
    X,
    Banknote,
    Save,
    Clock
} from 'lucide-react';
import './StaffFormModal.css';

interface EditPayrollModalProps {
    payroll: Payroll;
    staffName: string;
    onClose: (success?: boolean) => void;
}

export const EditPayrollModal: React.FC<EditPayrollModalProps> = ({ payroll, staffName, onClose }) => {
    const [formData, setFormData] = useState({
        normalHours: payroll.normalHours.toString(),
        normalPay: payroll.normalPay.toString(),
        otHours: payroll.otHours.toString(),
        otPay: payroll.otPay.toString(),
        travelExpenses: payroll.travelExpenses.toString(),
        leaveDeductions: payroll.leaveDeductions.toString(),
        totalPay: payroll.totalPay.toString(),
        notes: payroll.notes || '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Auto-calculate Total when components change
    // This provides a helpful "Sheet" experience
    const handleBlur = () => {
        const normalPay = parseFloat(formData.normalPay) || 0;
        const otPay = parseFloat(formData.otPay) || 0;
        const travel = parseFloat(formData.travelExpenses) || 0;
        const deductions = parseFloat(formData.leaveDeductions) || 0;

        const total = normalPay + otPay + travel - deductions;
        setFormData(prev => ({ ...prev, totalPay: total.toFixed(2) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await payrollService.update(payroll._id, {
                normalHours: parseFloat(formData.normalHours),
                normalPay: parseFloat(formData.normalPay),
                otHours: parseFloat(formData.otHours),
                otPay: parseFloat(formData.otPay),
                travelExpenses: parseFloat(formData.travelExpenses),
                leaveDeductions: parseFloat(formData.leaveDeductions),
                totalPay: parseFloat(formData.totalPay),
                notes: formData.notes,
            });

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update payroll');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-container fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-content">
                        <div className="icon-badge">
                            <Banknote size={24} />
                        </div>
                        <div>
                            <h2>Edit Payroll Record</h2>
                            <p className="subtitle">Manually adjust payroll details for {staffName}</p>
                        </div>
                    </div>
                    <button onClick={() => onClose()} className="close-button" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="error-banner">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-scroll-area">
                        <div className="grid-2">
                            <div className="form-section">
                                <h3 className="section-title"><Clock size={16} /> Normal Hours</h3>
                                <div className="input-group">
                                    <label htmlFor="normalHours">Hours</label>
                                    <input
                                        id="normalHours"
                                        name="normalHours"
                                        type="number" step="0.1"
                                        className="input"
                                        value={formData.normalHours}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="normalPay">Pay Amount ($)</label>
                                    <input
                                        id="normalPay"
                                        name="normalPay"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.normalPay}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="section-title"><Clock size={16} /> Overtime</h3>
                                <div className="input-group">
                                    <label htmlFor="otHours">OT Hours</label>
                                    <input
                                        id="otHours"
                                        name="otHours"
                                        type="number" step="0.1"
                                        className="input"
                                        value={formData.otHours}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="otPay">OT Amount ($)</label>
                                    <input
                                        id="otPay"
                                        name="otPay"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.otPay}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="input-group">
                                <label htmlFor="travelExpenses" style={{ color: '#059669' }}>Travel Expenses ($)</label>
                                <input
                                    id="travelExpenses"
                                    name="travelExpenses"
                                    type="number" step="0.01"
                                    className="input"
                                    value={formData.travelExpenses}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="leaveDeductions" style={{ color: '#dc2626' }}>Deductions ($)</label>
                                <input
                                    id="leaveDeductions"
                                    name="leaveDeductions"
                                    type="number" step="0.01"
                                    className="input"
                                    value={formData.leaveDeductions}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="totalPay" style={{ fontWeight: 'bold' }}>Total Pay ($)</label>
                            <input
                                id="totalPay"
                                name="totalPay"
                                type="number" step="0.01"
                                className="input"
                                value={formData.totalPay}
                                onChange={handleChange}
                                style={{ fontWeight: 'bold', fontSize: '1.1rem', borderColor: '#2563eb' }}
                            />
                            <p className="input-hint">Calculated automatically on blur, but you can override.</p>
                        </div>

                        <div className="input-group">
                            <label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                className="textarea"
                                rows={2}
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
