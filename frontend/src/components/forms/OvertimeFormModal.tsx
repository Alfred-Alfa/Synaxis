import React, { useState } from 'react';
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
            const formDataToSend = new FormData();
            formDataToSend.append('date', formData.date);
            formDataToSend.append('siteId', formData.siteId);
            formDataToSend.append('reason', formData.reason);

            if (formData.startTime && formData.endTime) {
                formDataToSend.append('startTime', formData.startTime);
                formDataToSend.append('endTime', formData.endTime);
            } else if (formData.otHours) {
                formDataToSend.append('otHours', formData.otHours);
            }

            if (file) {
                formDataToSend.append('attachment', file);
            }

            if (isEdit) {
                const updateData = {
                    date: formData.date,
                    startTime: formData.startTime || undefined,
                    endTime: formData.endTime || undefined,
                    otHours: formData.otHours ? parseFloat(formData.otHours) : undefined,
                    siteId: formData.siteId,
                    reason: formData.reason,
                };
                await overtimeService.update(overtime._id, updateData);
            } else {
                await overtimeService.create(formDataToSend);
            }

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} overtime request`);
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
                                OT Hours (if start/end time not provided)
                            </label>
                            <input
                                id="otHours"
                                name="otHours"
                                type="number"
                                step="0.25"
                                min="0"
                                className="input"
                                value={formData.otHours}
                                onChange={handleChange}
                                placeholder="Auto-calculated from start/end time"
                            />
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
