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
    Shield,
    Calendar,
    DollarSign,
    Lock,
    MapPin,
    Building2,
    Clock,
    CreditCard
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { Toast } from '../common/Toast';
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
        role: staff?.role || 'Staff',
        address: staff?.address || '',
        startDate: staff?.startDate ? new Date(staff.startDate).toISOString().split('T')[0] : '',
        password: '',
        otRate: staff?.otRate?.toString() || '',
        bankName: staff?.bankDetails?.bankName || '',
        accountNumber: staff?.bankDetails?.accountNumber || '',
        ifscCode: staff?.bankDetails?.ifscCode || '',
        accountHolderName: staff?.bankDetails?.accountHolderName || '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const originalRole = staff?.role || 'Staff'; // Track original role

    // Custom modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check if role is changing
        const isRoleChanging = isEdit && originalRole !== formData.role;

        if (isRoleChanging) {
            // Show custom confirmation modal
            setShowConfirmModal(true);
        } else {
            // No role change, proceed directly
            await saveStaff();
        }
    };

    const saveStaff = async () => {
        const isRoleChanging = isEdit && originalRole !== formData.role;
        setLoading(true);

        try {
            const data = {
                fullName: formData.fullName,
                email: formData.email,
                employeeId: formData.employeeId || undefined,
                phone: formData.phone || undefined,
                hourlyRate: parseFloat(formData.hourlyRate),
                designation: formData.designation || undefined,
                role: formData.role,
                address: formData.address || undefined,
                startDate: formData.startDate || undefined,
                password: formData.password || 'password123',
                otRate: formData.otRate ? parseFloat(formData.otRate) : undefined,
                bankDetails: (formData.bankName || formData.accountNumber) ? {
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    ifscCode: formData.ifscCode,
                    accountHolderName: formData.accountHolderName,
                } : undefined,
            };

            console.log('Submitting staff data:', data);
            console.log('Is Edit:', isEdit);
            console.log('Role value:', formData.role);

            if (isEdit) {
                const response = await staffService.update(staff._id, data);
                console.log('Update response:', response);

                // Show success toast for role change
                if (isRoleChanging) {
                    setSuccessMessage({
                        title: 'Success!',
                        message: `${staff?.fullName} has been successfully moved from "${originalRole}" to "${formData.role}" role.`
                    });
                    setShowSuccessToast(true);
                    // Close after a delay to show the toast
                    setTimeout(() => {
                        onClose(true);
                    }, 1500);
                } else {
                    onClose(true);
                }
            } else {
                const response: any = await staffService.create(data);
                console.log('Create response:', response);

                // Show success toast with email status
                const emailMessage = response.emailSent
                    ? "Login details sent to the staff email id."
                    : "However, failed to send login details email.";

                setSuccessMessage({
                    title: 'Staff Created Successfully',
                    message: `${formData.fullName} has been added. ${emailMessage}`
                });
                setShowSuccessToast(true);

                // Close after a delay
                setTimeout(() => {
                    onClose(true);
                }, 2000);
            }
        } catch (err: any) {
            console.error('Error updating staff:', err);
            console.error('Error response:', err.response);
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

                                <div className="input-group">
                                    <label htmlFor="role">System Role</label>
                                    <div className="input-wrapper">
                                        <Shield className="input-icon" size={18} />
                                        <select
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 1rem 0.625rem 2.5rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.95rem',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                backgroundColor: 'var(--input-bg)',
                                                height: '42px'
                                            }}
                                        >
                                            <option value="Staff">Staff</option>
                                            <option value="Admin">Admin</option>
                                            <option value="SuperAdmin">Super Admin</option>
                                        </select>
                                    </div>
                                    <p className="input-hint">System access level</p>
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

                        {/* Bank Details Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <CreditCard size={18} />
                                Bank Details
                            </h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="bankName">Bank Name</label>
                                    <div className="input-wrapper">
                                        <Building2 className="input-icon" size={18} />
                                        <input
                                            id="bankName"
                                            name="bankName"
                                            type="text"
                                            placeholder="e.g. Chase Bank"
                                            value={formData.bankName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="accountNumber">Account Number</label>
                                    <div className="input-wrapper">
                                        <CreditCard className="input-icon" size={18} />
                                        <input
                                            id="accountNumber"
                                            name="accountNumber"
                                            type="text"
                                            placeholder="Account / IBAN"
                                            value={formData.accountNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="ifscCode">BSB / Sort Code / IFSC</label>
                                    <div className="input-wrapper">
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            id="ifscCode"
                                            name="ifscCode"
                                            type="text"
                                            placeholder="Branch Code"
                                            value={formData.ifscCode}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="accountHolderName">Account Name</label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" size={18} />
                                        <input
                                            id="accountHolderName"
                                            name="accountHolderName"
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            value={formData.accountHolderName}
                                            onChange={handleChange}
                                        />
                                    </div>
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

            {/* Confirmation Modal for Role Change */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Confirm Role Change"
                message={`Are you sure you want to change ${staff?.fullName}'s role from "${originalRole}" to "${formData.role}"?\n\nThis will affect their system access permissions.`}
                confirmText="Yes, Change Role"
                cancelText="Cancel"
                type="warning"
                onConfirm={() => {
                    setShowConfirmModal(false);
                    saveStaff();
                }}
                onCancel={() => setShowConfirmModal(false)}
            />

            {/* Success Toast */}
            <Toast
                isOpen={showSuccessToast}
                title={successMessage.title}
                message={successMessage.message}
                type="success"
                duration={3000}
                onClose={() => setShowSuccessToast(false)}
            />
        </div>,
        document.body
    );
};
