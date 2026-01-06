import React, { useState, useEffect } from 'react';
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
        siteId: entry ? (entry.siteId && typeof entry.siteId === 'object' ? entry.siteId._id : entry.siteId?.toString() || '') : '',
        jobDescription: entry?.jobDescription || '',
        ownTransport: entry?.ownTransport || false,
        travelDistance: entry?.travelDetails?.distance || '',
        travelAmount: entry?.travelDetails?.amount?.toString() || '',
        travelNotes: entry?.travelDetails?.notes || '',
    });

    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeError, setTimeError] = useState('');

    // Auto-calculate total hours when start and end time are selected
    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            const start = new Date(`1970-01-01T${formData.startTime}:00`);
            const end = new Date(`1970-01-01T${formData.endTime}:00`);
            const diffMs = end.getTime() - start.getTime();
            const hours = diffMs / (1000 * 60 * 60);

            if (hours <= 0) {
                setTimeError('End time must be greater than start time');
                setFormData(prev => ({ ...prev, totalHours: '0.00' }));
            } else {
                setTimeError('');
                const calculatedHours = Math.round(hours * 100) / 100;
                setFormData(prev => ({ ...prev, totalHours: calculatedHours.toFixed(2) }));
            }
        } else if (!formData.startTime && !formData.endTime) {
            setTimeError('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.startTime, formData.endTime]);

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

                {/* Info Summary for Edit/Review Mode */}
                {(isEdit || isAdminReview) && entry && (
                    <div style={{
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '12px'
                    }}>
                        <div>
                            <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>📅 Date</div>
                            <div style={{ fontWeight: '500' }}>
                                {new Date(formData.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>🏢 Site/Project</div>
                            <div style={{ fontWeight: '500' }}>
                                {typeof entry.siteId === 'object' ? entry.siteId.name : sites.find(s => s._id === entry.siteId)?.name || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>⏱️ Hours</div>
                            <div style={{ fontWeight: '500', color: '#0066cc' }}>
                                {formData.totalHours || entry.totalHours || '0'} hrs
                            </div>
                        </div>
                        {entry.status && (
                            <div>
                                <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>Status</div>
                                <div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        background: entry.status === 'Approved' ? '#d4edda' :
                                            entry.status === 'Rejected' ? '#f8d7da' : '#fff3cd',
                                        color: entry.status === 'Approved' ? '#155724' :
                                            entry.status === 'Rejected' ? '#721c24' : '#856404'
                                    }}>
                                        {entry.status}
                                    </span>
                                </div>
                            </div>
                        )}
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
                                Total Hours {formData.startTime && formData.endTime ? '(Auto-calculated)' : ''}*
                            </label>
                            <input
                                id="totalHours"
                                name="totalHours"
                                type="number"
                                step="0.01"
                                min="0"
                                className="input"
                                value={formData.totalHours}
                                onChange={handleChange}
                                readOnly={!!(formData.startTime && formData.endTime)}
                                placeholder={formData.startTime && formData.endTime ? "Auto-calculated from start/end time" : "Enter hours or select start/end time"}
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

                    <div className="modal-footer" style={isAdminReview ? { flexDirection: 'column', gap: '0.75rem' } : undefined}>
                        {isAdminReview ? (
                            <>
                                {/* Rejection action - standalone at top */}
                                <div style={{ width: '100%', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={onReject}
                                        className="btn btn-danger"
                                        style={{ width: '100%' }}
                                        title="Reject this entry"
                                    >
                                        ❌ Reject Entry
                                    </button>
                                </div>

                                {/* Main actions - grouped together */}
                                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                    <button
                                        type="button"
                                        onClick={() => onClose()}
                                        className="btn btn-secondary"
                                        style={{ flex: 1 }}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || !!timeError}
                                        style={{ flex: 1 }}
                                    >
                                        💾 Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onApprove}
                                        className="btn btn-success"
                                        disabled={!!timeError}
                                        style={{ flex: 1 }}
                                        title="Approve this entry"
                                    >
                                        ✓ Approve
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
                                    disabled={loading || !!timeError}
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
