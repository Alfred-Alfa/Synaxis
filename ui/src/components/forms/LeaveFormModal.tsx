import React, { useState } from 'react';
import { leaveService } from '../../services/leaveService';
import type { Leave } from '../../types';
import '../forms/StaffFormModal.css';

interface LeaveFormModalProps {
    leave: Leave | null;
    onClose: (success?: boolean) => void;
}

export const LeaveFormModal: React.FC<LeaveFormModalProps> = ({ leave, onClose }) => {
    const isEdit = !!leave;

    const [formData, setFormData] = useState({
        leaveType: leave?.leaveType || 'Paid',
        startDate: leave?.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
        endDate: leave?.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
        isHalfDay: leave?.isHalfDay || false,
        halfDaySession: leave?.halfDaySession || 'First Half',
        reason: leave?.reason || '',
    });

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('leaveType', formData.leaveType);
            formDataToSend.append('startDate', formData.startDate);
            formDataToSend.append('endDate', formData.endDate);
            formDataToSend.append('isHalfDay', formData.isHalfDay.toString());
            if (formData.isHalfDay) {
                formDataToSend.append('halfDaySession', formData.halfDaySession);
            }
            formDataToSend.append('reason', formData.reason);

            if (file) {
                formDataToSend.append('attachment', file);
            }

            if (isEdit) {
                const updateData = {
                    leaveType: formData.leaveType as 'Paid' | 'Unpaid' | 'Sick' | 'Casual',
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    isHalfDay: formData.isHalfDay,
                    halfDaySession: formData.isHalfDay ? (formData.halfDaySession as 'First Half' | 'Second Half') : undefined,
                    reason: formData.reason,
                };
                await leaveService.update(leave._id, updateData);
            } else {
                await leaveService.create(formDataToSend);
            }

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} leave application`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Leave Application' : 'Apply for Leave'}</h2>
                    <button onClick={() => onClose()} className="modal-close">×</button>
                </div>

                {error && (
                    <div className="error-alert mb-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="leaveType" className="form-label">
                                Leave Type *
                            </label>
                            <select
                                id="leaveType"
                                name="leaveType"
                                className="select"
                                value={formData.leaveType}
                                onChange={handleChange}
                                required
                            >
                                <option value="Paid">Paid Leave</option>
                                <option value="Unpaid">Unpaid Leave</option>
                                <option value="Sick">Sick Leave</option>
                                <option value="Casual">Casual Leave</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isHalfDay"
                                    checked={formData.isHalfDay}
                                    onChange={handleChange}
                                />
                                <span>Half Day</span>
                            </label>
                        </div>

                        {formData.isHalfDay && (
                            <div className="form-group">
                                <label htmlFor="halfDaySession" className="form-label">
                                    Session *
                                </label>
                                <select
                                    id="halfDaySession"
                                    name="halfDaySession"
                                    className="select"
                                    value={formData.halfDaySession}
                                    onChange={handleChange}
                                >
                                    <option value="First Half">First Half (AM)</option>
                                    <option value="Second Half">Second Half (PM)</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="startDate" className="form-label">
                                Start Date *
                            </label>
                            <input
                                id="startDate"
                                name="startDate"
                                type="date"
                                className="input"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endDate" className="form-label">
                                End Date *
                            </label>
                            <input
                                id="endDate"
                                name="endDate"
                                type="date"
                                className="input"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                min={formData.startDate}
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="reason" className="form-label">
                                Reason *
                            </label>
                            <textarea
                                id="reason"
                                name="reason"
                                className="textarea"
                                rows={4}
                                value={formData.reason}
                                onChange={handleChange}
                                required
                                placeholder="Please provide a reason for your leave..."
                            />
                        </div>

                        {!isEdit && (
                            <div className="form-group form-group-full">
                                <label htmlFor="attachment" className="form-label">
                                    Attachment (optional)
                                </label>
                                <input
                                    id="attachment"
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="input"
                                />
                                <small className="text-muted">Medical certificate or supporting document</small>
                            </div>
                        )}
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
                            {loading ? 'Saving...' : isEdit ? 'Update Application' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
