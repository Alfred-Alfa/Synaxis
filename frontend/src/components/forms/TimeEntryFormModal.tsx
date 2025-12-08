import React, { useState } from 'react';
import { timeEntryService } from '../../services/timeEntryService';
import type { TimeEntry, Site } from '../../types';
import './TimeEntryFormModal.css';

interface TimeEntryFormModalProps {
    entry: TimeEntry | null;
    sites: Site[];
    onClose: (success?: boolean) => void;
    isAdminReview?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
}

export const TimeEntryFormModal: React.FC<TimeEntryFormModalProps> = ({
    entry,
    sites,
    onClose,
    isAdminReview = false,
    onApprove,
    onReject
}) => {
    const isEdit = !!entry;

    const [formData, setFormData] = useState({
        date: entry?.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: entry?.startTime || '',
        endTime: entry?.endTime || '',
        totalHours: entry?.totalHours?.toString() || '',
        siteId: entry ? (typeof entry.siteId === 'object' ? entry.siteId._id : entry.siteId) : '',
        jobDescription: entry?.jobDescription || '',
        ownTransport: entry?.ownTransport || false,
        travelDistance: entry?.travelDetails?.distance || '',
        travelAmount: entry?.travelDetails?.amount?.toString() || '',
        travelNotes: entry?.travelDetails?.notes || '',
    });

    const [files, setFiles] = useState<File[]>([]);
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
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
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
            formDataToSend.append('jobDescription', formData.jobDescription);
            formDataToSend.append('ownTransport', formData.ownTransport.toString());

            if (formData.startTime && formData.endTime) {
                formDataToSend.append('startTime', formData.startTime);
                formDataToSend.append('endTime', formData.endTime);
            } else if (formData.totalHours) {
                formDataToSend.append('totalHours', formData.totalHours);
            }

            if (formData.ownTransport) {
                if (formData.travelDistance) formDataToSend.append('travelDistance', formData.travelDistance);
                if (formData.travelAmount) formDataToSend.append('travelAmount', formData.travelAmount);
                if (formData.travelNotes) formDataToSend.append('travelNotes', formData.travelNotes);
            }

            files.forEach((file) => {
                formDataToSend.append('attachments', file);
            });

            if (isEdit) {
                // For edit, we can't use FormData easily, so convert to JSON
                const updateData = {
                    date: formData.date,
                    startTime: formData.startTime || undefined,
                    endTime: formData.endTime || undefined,
                    totalHours: formData.totalHours ? parseFloat(formData.totalHours) : undefined,
                    siteId: formData.siteId,
                    jobDescription: formData.jobDescription,
                    ownTransport: formData.ownTransport,
                    travelDetails: formData.ownTransport ? {
                        distance: formData.travelDistance,
                        amount: formData.travelAmount ? parseFloat(formData.travelAmount) : 0,
                        notes: formData.travelNotes,
                    } : undefined,
                };
                if (entry) {
                    await timeEntryService.update(entry._id, updateData);
                }
            } else {
                await timeEntryService.create(formDataToSend);
            }

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} time entry`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Time Entry' : 'New Time Entry'}</h2>
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
                            <label htmlFor="totalHours" className="form-label">
                                Total Hours (if start/end time not provided)
                            </label>
                            <input
                                id="totalHours"
                                name="totalHours"
                                type="number"
                                step="0.25"
                                min="0"
                                className="input"
                                value={formData.totalHours}
                                onChange={handleChange}
                                placeholder="Auto-calculated from start/end time"
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="jobDescription" className="form-label">
                                Job Description *
                            </label>
                            <textarea
                                id="jobDescription"
                                name="jobDescription"
                                className="textarea"
                                rows={3}
                                value={formData.jobDescription}
                                onChange={handleChange}
                                required
                                placeholder="Describe the work performed..."
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="ownTransport"
                                    checked={formData.ownTransport}
                                    onChange={handleChange}
                                />
                                <span>Used own transportation</span>
                            </label>
                        </div>

                        {formData.ownTransport && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="travelDistance" className="form-label">
                                        Travel Distance
                                    </label>
                                    <input
                                        id="travelDistance"
                                        name="travelDistance"
                                        type="text"
                                        className="input"
                                        value={formData.travelDistance}
                                        onChange={handleChange}
                                        placeholder="e.g., 50 km"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="travelAmount" className="form-label">
                                        Travel Amount ($)
                                    </label>
                                    <input
                                        id="travelAmount"
                                        name="travelAmount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input"
                                        value={formData.travelAmount}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group form-group-full">
                                    <label htmlFor="travelNotes" className="form-label">
                                        Travel Notes
                                    </label>
                                    <textarea
                                        id="travelNotes"
                                        name="travelNotes"
                                        className="textarea"
                                        rows={2}
                                        value={formData.travelNotes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}

                        {!isEdit && (
                            <div className="form-group form-group-full">
                                <label htmlFor="attachments" className="form-label">
                                    Attachments (optional)
                                </label>
                                <input
                                    id="attachments"
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="input"
                                />
                                <small className="text-muted">Images or PDFs only</small>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer" style={isAdminReview ? { justifyContent: 'space-between' } : undefined}>
                        {isAdminReview ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onReject}
                                    className="btn btn-danger"
                                    title="Reject this entry"
                                >
                                    Reject
                                </button>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => onClose()}
                                        className="btn btn-secondary"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onApprove}
                                        className="btn btn-success"
                                        title="Approve this entry"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
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
                                    {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Submit Entry'}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
