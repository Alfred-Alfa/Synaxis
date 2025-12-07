import React, { useState } from 'react';
import { staffService } from '../../services/staffService';
import type { Staff } from '../../types';
import './StaffFormModal.css';

interface StaffFormModalProps {
    staff: Staff | null;
    onClose: (success?: boolean) => void;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({ staff, onClose }) => {
    const isEdit = !!staff;

    const [formData, setFormData] = useState({
        fullName: staff?.fullName || '',
        email: staff?.email || '',
        phone: staff?.phone || '',
        hourlyRate: staff?.hourlyRate?.toString() || '',
        designation: staff?.designation || '',
        address: staff?.address || '',
        startDate: staff?.startDate ? new Date(staff.startDate).toISOString().split('T')[0] : '',
        password: '',
        otRate: staff?.otRate?.toString() || '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            const data = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone || undefined,
                hourlyRate: parseFloat(formData.hourlyRate),
                designation: formData.designation || undefined,
                address: formData.address || undefined,
                startDate: formData.startDate || undefined,
                password: formData.password || 'password123',
                otRate: formData.otRate ? parseFloat(formData.otRate) : undefined,
            };

            if (isEdit) {
                await staffService.update(staff._id, data);
            } else {
                await staffService.create(data);
            }

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} staff`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
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
                            <label htmlFor="fullName" className="form-label">
                                Full Name *
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                className="input"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isEdit}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">
                                Phone
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                className="input"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="designation" className="form-label">
                                Designation
                            </label>
                            <input
                                id="designation"
                                name="designation"
                                type="text"
                                className="input"
                                value={formData.designation}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="hourlyRate" className="form-label">
                                Hourly Rate ($) *
                            </label>
                            <input
                                id="hourlyRate"
                                name="hourlyRate"
                                type="number"
                                step="0.01"
                                min="0"
                                className="input"
                                value={formData.hourlyRate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="otRate" className="form-label">
                                OT Rate Multiplier
                            </label>
                            <input
                                id="otRate"
                                name="otRate"
                                type="number"
                                step="0.1"
                                min="1"
                                className="input"
                                value={formData.otRate}
                                onChange={handleChange}
                                placeholder="Leave empty for default"
                            />
                            <small className="text-muted">Staff-specific OT rate (e.g., 1.5 for 1.5x hourly rate)</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="startDate" className="form-label">
                                Start Date
                            </label>
                            <input
                                id="startDate"
                                name="startDate"
                                type="date"
                                className="input"
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                        </div>

                        {!isEdit && (
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Default: password123"
                                />
                                <small className="text-muted">User can change this after first login</small>
                            </div>
                        )}

                        <div className="form-group form-group-full">
                            <label htmlFor="address" className="form-label">
                                Address
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                className="textarea"
                                rows={3}
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>
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
                            {loading ? 'Saving...' : isEdit ? 'Update Staff' : 'Add Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
