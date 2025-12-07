import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { staffService } from '../../services/staffService';
import type { Staff } from '../../types';
import {
    X,
    User,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    DollarSign,
    Lock,
    MapPin,
    Building2,
    Clock
} from 'lucide-react';
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
        employeeId: staff?.employeeId || '',
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
                employeeId: formData.employeeId || undefined,
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

    return createPortal(
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-container fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-content">
                        <div className="icon-badge">
                            <User size={24} />
                        </div>
                        <div>
                            <h2>{isEdit ? 'Edit Staff Profile' : 'New Staff Member'}</h2>
                            <p className="subtitle">
                                {isEdit ? 'Update employee details and compensation' : 'Add a new employee to your organization'}
                            </p>
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
                        {/* Personal Information Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <User size={18} />
                                Personal Information
                            </h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" size={18} />
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" size={18} />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="john@company.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={isEdit}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <div className="input-wrapper">
                                        <Phone className="input-icon" size={18} />
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="address">Address</label>
                                    <div className="input-wrapper">
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            id="address"
                                            name="address"
                                            type="text"
                                            placeholder="123 Business St"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Details Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <Briefcase size={18} />
                                Employment Details
                            </h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="employeeId">Employee ID</label>
                                    <div className="input-wrapper">
                                        <Briefcase className="input-icon" size={18} />
                                        <input
                                            id="employeeId"
                                            name="employeeId"
                                            type="text"
                                            placeholder="e.g. EMP001"
                                            value={formData.employeeId}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="designation">Designation</label>
                                    <div className="input-wrapper">
                                        <Building2 className="input-icon" size={18} />
                                        <input
                                            id="designation"
                                            name="designation"
                                            type="text"
                                            placeholder="e.g. Senior Developer"
                                            value={formData.designation}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="startDate">Start Date</label>
                                    <div className="input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input
                                            id="startDate"
                                            name="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="hourlyRate">Hourly Rate ($) <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" size={18} />
                                        <input
                                            id="hourlyRate"
                                            name="hourlyRate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={formData.hourlyRate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="otRate">Overtime Multiplier</label>
                                    <div className="input-wrapper">
                                        <Clock className="input-icon" size={18} />
                                        <input
                                            id="otRate"
                                            name="otRate"
                                            type="number"
                                            step="0.1"
                                            min="1"
                                            placeholder="e.g. 1.5"
                                            value={formData.otRate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <p className="input-hint">Standard is 1.5x hourly rate</p>
                                </div>
                            </div>
                        </div>

                        {/* Account Section */}
                        {!isEdit && (
                            <div className="form-section">
                                <h3 className="section-title">
                                    <Lock size={18} />
                                    Account Security
                                </h3>
                                <div className="input-group">
                                    <label htmlFor="password">Initial Password</label>
                                    <div className="input-wrapper">
                                        <Lock className="input-icon" size={18} />
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="Default: password123"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <p className="input-hint">The employee can change this after their first login</p>
                                </div>
                            </div>
                        )}
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
                            {loading ? 'Creating Profile...' : (isEdit ? 'Save Changes' : 'Create Profile')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
