import React, { useState, useEffect } from 'react';
import { overtimeService } from '../../services/overtimeService';
import type { Overtime, Site } from '../../types';
import '../forms/StaffFormModal.css';

interface OvertimeFormModalProps {
    overtime: Overtime | null;
    sites: Site[];
    onClose: (success?: boolean) => void;
}

export const OvertimeFormModal: React.FC<OvertimeFormModalProps> = ({ overtime, sites, onClose }) => {
    const isEdit = !!overtime;

    const [formData, setFormData] = useState({
        date: overtime?.date ? new Date(overtime.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: overtime?.startTime || '',
        endTime: overtime?.endTime || '',
        otHours: overtime?.otHours?.toString() || '',
        siteId: overtime ? (typeof overtime.siteId === 'object' ? overtime.siteId._id : overtime.siteId) : '',
        reason: overtime?.reason || '',
    });

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeError, setTimeError] = useState('');

    // Auto-calculate OT hours when start and end time are selected
    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            // Create date objects for time comparison
            const start = new Date(`1970-01-01T${formData.startTime}:00`);
            const end = new Date(`1970-01-01T${formData.endTime}:00`);

            // Calculate difference in milliseconds
            const diffMs = end.getTime() - start.getTime();

            // Convert to hours
            const hours = diffMs / (1000 * 60 * 60);

            // Validate: end time must be greater than start time
            if (hours <= 0) {
                setTimeError('End time must be greater than start time');
                setFormData(prev => ({ ...prev, otHours: '0.00' }));
            } else {
                setTimeError('');
                // Round to 2 decimal places and ensure it's a valid number
                const calculatedHours = Math.round(hours * 100) / 100;
                setFormData(prev => ({ ...prev, otHours: calculatedHours.toFixed(2) }));
            }
        } else if (!formData.startTime && !formData.endTime) {
            // Clear calculated hours if both times are cleared
            setTimeError('');
            if (formData.otHours === '0.00' || parseFloat(formData.otHours) > 0) {
                // Keep manual otHours if user entered it
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.startTime, formData.endTime, setFormData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
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
            // Validate otHours before submission
            const otHoursValue = parseFloat(formData.otHours);

            // Prevent NaN or invalid values
            if (isNaN(otHoursValue) || otHoursValue <= 0) {
                setError('Please provide valid start/end time or enter OT hours manually');
                setLoading(false);
                return;
            }

            // Additional validation for time error
            if (timeError) {
                setError(timeError);
                setLoading(false);
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('date', formData.date);
            formDataToSend.append('siteId', formData.siteId);
            formDataToSend.append('reason', formData.reason);

            // Always send otHours as a valid number
            formDataToSend.append('otHours', otHoursValue.toString());

            if (formData.startTime && formData.endTime) {
                formDataToSend.append('startTime', formData.startTime);
                formDataToSend.append('endTime', formData.endTime);
            }

            if (file) {
                formDataToSend.append('attachment', file);
            }

            if (isEdit) {
                const updateData = {
                    date: formData.date,
                    startTime: formData.startTime || undefined,
                    endTime: formData.endTime || undefined,
                    otHours: otHoursValue,
                    siteId: formData.siteId,
                    reason: formData.reason,
                };
                await overtimeService.update(overtime._id, updateData);
            } else {
                await overtimeService.create(formDataToSend);
            }

            onClose(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} overtime request`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Overtime Request' : 'New Overtime Request'}</h2>
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
                            <label htmlFor="date" className="form-label">
                                Date *
                            </label>
                            <input
                                id="date"
                                name="date"
                                type="date"
                                className="input"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="siteId" className="form-label">
                                Site/Project *
                            </label>
                            <select
                                id="siteId"
                                name="siteId"
                                className="select"
                                value={formData.siteId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a site</option>
                                {sites.map((site) => (
                                    <option key={site._id} value={site._id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="startTime" className="form-label">
                                Start Time
                            </label>
                            <input
                                id="startTime"
                                name="startTime"
                                type="time"
                                className="input"
                                value={formData.startTime}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endTime" className="form-label">
                                End Time
                            </label>
                            <input
                                id="endTime"
                                name="endTime"
                                type="time"
                                className="input"
                                value={formData.endTime}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="otHours" className="form-label">
                                OT Hours {formData.startTime && formData.endTime ? '(Auto-calculated)' : ''}*
                            </label>
                            <input
                                id="otHours"
                                name="otHours"
                                type="number"
                                step="0.01"
                                min="0"
                                className="input"
                                value={formData.otHours}
                                onChange={handleChange}
                                readOnly={!!(formData.startTime && formData.endTime)}
                                placeholder={formData.startTime && formData.endTime ? "Auto-calculated from start/end time" : "Enter OT hours or select start/end time"}
                                style={{
                                    backgroundColor: formData.startTime && formData.endTime ? '#f5f5f5' : 'white',
                                    cursor: formData.startTime && formData.endTime ? 'not-allowed' : 'text'
                                }}
                            />
                            {timeError && (
                                <small style={{ color: '#dc3545', display: 'block', marginTop: '4px' }}>
                                    {timeError}
                                </small>
                            )}
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="reason" className="form-label">
                                Reason/Work Description *
                            </label>
                            <textarea
                                id="reason"
                                name="reason"
                                className="textarea"
                                rows={4}
                                value={formData.reason}
                                onChange={handleChange}
                                required
                                placeholder="Describe the overtime work performed..."
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
                                <small className="text-muted">Image or PDF only</small>
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
                            {loading ? 'Saving...' : isEdit ? 'Update Request' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
