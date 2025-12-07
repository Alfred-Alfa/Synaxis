import React, { useState } from 'react';
import { payrollService } from '../../services/payrollService';
import type { Staff } from '../../types';
import '../forms/StaffFormModal.css';

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
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            });

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate payroll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Generate Payroll</h2>
                    <button onClick={() => onClose()} className="modal-close">×</button>
                </div>

                {error && (
                    <div className="error-alert mb-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group form-group-full">
                            <label htmlFor="staffId" className="form-label">
                                Staff Member *
                            </label>
                            <select
                                id="staffId"
                                name="staffId"
                                className="select"
                                value={formData.staffId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a staff member</option>
                                {staff.map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.fullName} - ${s.hourlyRate}/hr
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="periodStart" className="form-label">
                                Period Start Date *
                            </label>
                            <input
                                id="periodStart"
                                name="periodStart"
                                type="date"
                                className="input"
                                value={formData.periodStart}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="periodEnd" className="form-label">
                                Period End Date *
                            </label>
                            <input
                                id="periodEnd"
                                name="periodEnd"
                                type="date"
                                className="input"
                                value={formData.periodEnd}
                                onChange={handleChange}
                                required
                                min={formData.periodStart}
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="notes" className="form-label">
                                Notes (optional)
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                className="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any additional notes for this payroll..."
                            />
                        </div>
                    </div>

                    <div className="alert-info" style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: '#dbeafe',
                        borderRadius: 'var(--radius-md)',
                        marginTop: 'var(--spacing-lg)'
                    }}>
                        <strong>ℹ️ Calculation Details:</strong>
                        <ul style={{ marginTop: 'var(--spacing-sm)', marginBottom: 0, paddingLeft: '1.5rem' }}>
                            <li>Normal hours from approved time entries × hourly rate</li>
                            <li>OT hours from approved overtime × (hourly rate × OT rate)</li>
                            <li>Travel expenses from approved time entries</li>
                            <li>Unpaid leave deductions calculated automatically</li>
                        </ul>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Generating...' : 'Generate Payroll'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
