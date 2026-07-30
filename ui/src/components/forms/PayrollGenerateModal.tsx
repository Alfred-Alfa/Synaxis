import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { payrollService } from '../../services/payrollService';
import type { Staff } from '../../types';
import {
    X,
    Banknote,
    Calendar,
    User,
    FileText,
    Calculator,
    Percent
} from 'lucide-react';
import './StaffFormModal.css';
import { settingsService } from '../../services/settingsService';

interface PayrollGenerateModalProps {
    staff: Staff[];
    onClose: (success?: boolean) => void;
}

export const PayrollGenerateModal: React.FC<PayrollGenerateModalProps> = ({ staff, onClose }) => {
    const [formData, setFormData] = useState({
        staffId: '',
        periodStart: '',
        periodEnd: '',
        notes: '',
        taxPercentage: '0',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('$');

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await settingsService.get();
                if (res.data?.currency) {
                    const symbols: Record<string, string> = {
                        USD: '$', GBP: '£', EUR: '€', INR: '₹', SGD: 'S$', AUD: 'A$', CAD: 'C$', AED: 'AED '
                    };
                    setCurrencySymbol(symbols[res.data.currency] || res.data.currency);
                }
            } catch (e) {
                console.error("Failed to fetch settings", e);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await payrollService.generate({
                staffId: formData.staffId,
                periodStart: formData.periodStart,
                periodEnd: formData.periodEnd,
                notes: formData.notes || undefined,
                taxPercentage: parseFloat(formData.taxPercentage) || 0,
            });

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate payroll');
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
                            <h2>Generate Payroll</h2>
                            <p className="subtitle">Calculates payments based on approved time & overtime</p>
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
                        {/* Staff Selection */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <User size={18} />
                                Employee Selection
                            </h3>
                            <div className="input-group">
                                <label htmlFor="staffId">Staff Member <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <User className="input-icon" size={18} />
                                    <select
                                        id="staffId"
                                        name="staffId"
                                        value={formData.staffId}
                                        onChange={handleChange}
                                        required
                                        className="input"
                                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                                    >
                                        <option value="">Select an employee...</option>
                                        {staff.map((s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.fullName} — {currencySymbol}{s.hourlyRate}/hr
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Pay Period */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <Calendar size={18} />
                                Pay Period
                            </h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="periodStart">Start Date <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input
                                            id="periodStart"
                                            name="periodStart"
                                            type="date"
                                            value={formData.periodStart}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="periodEnd">End Date <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input
                                            id="periodEnd"
                                            name="periodEnd"
                                            type="date"
                                            value={formData.periodEnd}
                                            onChange={handleChange}
                                            required
                                            min={formData.periodStart}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <Percent size={18} />
                                Tax Deduction
                            </h3>
                            <div className="input-group">
                                <label htmlFor="taxPercentage">Tax Percentage (%)</label>
                                <div className="input-wrapper">
                                    <Percent className="input-icon" size={18} />
                                    <input
                                        id="taxPercentage"
                                        name="taxPercentage"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={formData.taxPercentage}
                                        onChange={handleChange}
                                        placeholder="0"
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                                    Set to 0 for no tax. This will be deducted from gross pay.
                                </p>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <FileText size={18} />
                                Additional Details
                            </h3>
                            <div className="input-group">
                                <label htmlFor="notes">Notes</label>
                                <div className="input-wrapper">
                                    <FileText className="input-icon" size={18} style={{ top: '12px' }} />
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Add any internal notes regarding this payroll..."
                                        style={{ paddingLeft: '2.5rem', width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div style={{
                            backgroundColor: '#eff6ff',
                            borderRadius: '12px',
                            padding: '1rem',
                            border: '1px solid #dbeafe',
                            display: 'flex',
                            gap: '0.75rem'
                        }}>
                            <div style={{ color: '#2563eb', marginTop: '2px' }}>
                                <Calculator size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e40af', fontWeight: 600 }}>Calculation Breakdown</h4>
                                <ul style={{ margin: 0, paddingLeft: '1rem', color: '#334155', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                    <li><strong>Total Working Hours</strong> from approved time entries</li>
                                    <li><strong>Overtime Hours</strong> from approved OT entries</li>
                                    <li>Gross = (Hours × Rate) + (OT × OT Rate) + Travel − Leave Deductions</li>
                                    <li><strong>Net Pay</strong> = Gross − Tax Deduction</li>
                                </ul>
                            </div>
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
                        >
                            {loading ? 'Processing...' : 'Generate Payroll'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
