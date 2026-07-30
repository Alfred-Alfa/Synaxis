import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { payrollService } from '../../services/payrollService';
import type { Payroll } from '../../types';
import {
    X,
    Banknote,
    Save,
    Clock,
    Percent
} from 'lucide-react';
import './StaffFormModal.css';

interface EditPayrollModalProps {
    payroll: Payroll;
    staffName: string;
    onClose: (success?: boolean) => void;
}

export const EditPayrollModal: React.FC<EditPayrollModalProps> = ({ payroll, staffName, onClose }) => {
    // Derive initial per-hour rates from existing data
    const initialRegularRate = payroll.normalHours > 0
        ? (payroll.normalPay / payroll.normalHours).toFixed(2)
        : '0';
    const initialOtRate = payroll.otHours > 0
        ? (payroll.otPay / payroll.otHours).toFixed(2)
        : '0';

    const [formData, setFormData] = useState({
        normalHours: payroll.normalHours.toFixed(2),
        regularRate: initialRegularRate,
        normalPay: payroll.normalPay.toFixed(2),
        otHours: payroll.otHours.toFixed(2),
        otRate: initialOtRate,
        otPay: payroll.otPay.toFixed(2),
        travelExpenses: payroll.travelExpenses.toFixed(2),
        leaveDeductions: payroll.leaveDeductions.toFixed(2),
        bonus: (payroll.bonus || 0).toFixed(2),
        taxPercentage: (payroll.taxPercentage || 0).toString(),
        taxDeduction: (payroll.taxDeduction || 0).toFixed(2),
        grossPay: (payroll.grossPay || payroll.totalPay).toFixed(2),
        totalPay: payroll.totalPay.toFixed(2),
        notes: payroll.notes || '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const recalculate = (updates: Partial<typeof formData> = {}) => {
        const merged = { ...formData, ...updates };

        const normalHours = parseFloat(merged.normalHours) || 0;
        const regularRate = parseFloat(merged.regularRate) || 0;
        const otHours = parseFloat(merged.otHours) || 0;
        const otRate = parseFloat(merged.otRate) || 0;
        const travel = parseFloat(merged.travelExpenses) || 0;
        const deductions = parseFloat(merged.leaveDeductions) || 0;
        const bonus = parseFloat(merged.bonus) || 0;
        const taxPct = parseFloat(merged.taxPercentage) || 0;

        const normalPay = Math.round(normalHours * regularRate * 100) / 100;
        const otPay = Math.round(otHours * otRate * 100) / 100;
        const gross = normalPay + otPay + travel + bonus - deductions;
        const taxAmt = Math.round((gross * taxPct) / 100 * 100) / 100;
        const net = Math.max(0, gross - taxAmt);

        setFormData({
            ...merged,
            normalPay: normalPay.toFixed(2),
            otPay: otPay.toFixed(2),
            grossPay: gross.toFixed(2),
            taxDeduction: taxAmt.toFixed(2),
            totalPay: net.toFixed(2),
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // For fields that trigger auto-calc, recalculate on change itself for live feedback
        const autoCalcFields = ['normalHours', 'regularRate', 'otHours', 'otRate', 'travelExpenses', 'leaveDeductions', 'bonus', 'taxPercentage'];
        if (autoCalcFields.includes(name)) {
            recalculate({ [name]: value });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                bonus: parseFloat(formData.bonus),
                taxPercentage: parseFloat(formData.taxPercentage),
                taxDeduction: parseFloat(formData.taxDeduction),
                grossPay: parseFloat(formData.grossPay),
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
                        {/* Regular Work */}
                        <div className="form-section">
                            <h3 className="section-title"><Clock size={16} /> Working Hours</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="normalHours">Hours</label>
                                    <input
                                        id="normalHours"
                                        name="normalHours"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.normalHours}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="regularRate">Rate / hr</label>
                                    <input
                                        id="regularRate"
                                        name="regularRate"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.regularRate}
                                        onChange={handleChange}
                                        style={{ borderColor: '#3b82f6' }}
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="normalPay" style={{ color: '#64748b' }}>= Pay</label>
                                    <input
                                        id="normalPay"
                                        name="normalPay"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.normalPay}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', fontWeight: 600 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Overtime */}
                        <div className="form-section">
                            <h3 className="section-title"><Clock size={16} /> Overtime</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="otHours">Hours</label>
                                    <input
                                        id="otHours"
                                        name="otHours"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.otHours}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="otRate">Rate / hr</label>
                                    <input
                                        id="otRate"
                                        name="otRate"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.otRate}
                                        onChange={handleChange}
                                        style={{ borderColor: '#d97706' }}
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="otPay" style={{ color: '#64748b' }}>= Pay</label>
                                    <input
                                        id="otPay"
                                        name="otPay"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.otPay}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', fontWeight: 600 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Extras */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                            <div className="input-group">
                                <label htmlFor="travelExpenses" style={{ color: '#059669' }}>Travel (+)</label>
                                <input
                                    id="travelExpenses"
                                    name="travelExpenses"
                                    type="number" step="0.01"
                                    className="input"
                                    value={formData.travelExpenses}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="bonus" style={{ color: '#059669' }}>Bonus (+)</label>
                                <input
                                    id="bonus"
                                    name="bonus"
                                    type="number" step="0.01"
                                    className="input"
                                    value={formData.bonus}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="leaveDeductions" style={{ color: '#dc2626' }}>Leave (−)</label>
                                <input
                                    id="leaveDeductions"
                                    name="leaveDeductions"
                                    type="number" step="0.01"
                                    className="input"
                                    value={formData.leaveDeductions}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Tax */}
                        <div className="form-section" style={{ marginTop: '0.25rem' }}>
                            <h3 className="section-title"><Percent size={16} /> Tax</h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="taxPercentage" style={{ color: '#7c3aed' }}>Tax %</label>
                                    <input
                                        id="taxPercentage"
                                        name="taxPercentage"
                                        type="number" step="0.1" min="0" max="100"
                                        className="input"
                                        value={formData.taxPercentage}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="taxDeduction" style={{ color: '#7c3aed' }}>Tax Amount (auto)</label>
                                    <input
                                        id="taxDeduction"
                                        name="taxDeduction"
                                        type="number" step="0.01"
                                        className="input"
                                        value={formData.taxDeduction}
                                        readOnly
                                        style={{ backgroundColor: '#f8fafc' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                            borderRadius: '12px',
                            padding: '1rem 1.25rem',
                            marginTop: '0.5rem',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem'
                        }}>
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Gross Pay</div>
                                <div style={{ color: '#e2e8f0', fontSize: '1.2rem', fontWeight: 700 }}>{formData.grossPay}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Net Pay</div>
                                <div style={{ color: '#4ade80', fontSize: '1.4rem', fontWeight: 800 }}>{formData.totalPay}</div>
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: '0.75rem' }}>
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
