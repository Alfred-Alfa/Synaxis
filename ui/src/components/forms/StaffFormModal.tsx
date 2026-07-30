import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { staffService } from '../../services/staffService';
import { settingsService } from '../../services/settingsService';
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

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getPhotoUrl = (rawPath: string | undefined | null) => {
    if (!rawPath) return '';
    if (rawPath.startsWith('http') || rawPath.startsWith('data:') || rawPath.startsWith('blob')) return rawPath;
    const filename = rawPath.replace(/\\/g, '/').split('/').pop();
    if (!filename) return '';
    return `${API_BASE_URL}/uploads/${filename}`;
};

interface StaffFormModalProps {
    staff: Staff | null;
    existingEmployeeIds?: string[];
    onClose: (success?: boolean) => void;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({ staff, existingEmployeeIds = [], onClose }) => {
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
        leaveBalance: staff?.leaveBalance?.toString() || '',
        standardPayableHours: staff?.standardPayableHours?.toString() || '',
        bankName: staff?.bankDetails?.bankName || '',
        accountNumber: staff?.bankDetails?.accountNumber || '',
        ifscCode: staff?.bankDetails?.ifscCode || '',
        accountHolderName: staff?.bankDetails?.accountHolderName || '',
        homeLocationLabel: staff?.homeLocation?.label || '',
        homeLocationLat: staff?.homeLocation?.coordinates?.latitude?.toString() || '',
        homeLocationLng: staff?.homeLocation?.coordinates?.longitude?.toString() || '',
        homeLocationRadius: staff?.homeLocation?.radius?.toString() || '150',
    });
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(staff?.profilePhoto || null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const originalRole = staff?.role || 'Staff'; // Track original role

    // Custom modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Dynamic roles state
    const [customRoles, setCustomRoles] = useState<{ name: string, accessLevel: 'SuperAdmin' | 'Admin' | 'Staff' }[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsService.get();
                if (response.data?.customRoles) {
                    setCustomRoles(response.data.customRoles);
                }
                if (response.data?.currency) {
                    const symbols: Record<string, string> = {
                        USD: '$', GBP: '£', EUR: '€', INR: '₹', SGD: 'S$', AUD: 'A$', CAD: 'C$', AED: 'AED '
                    };
                    setCurrencySymbol(symbols[response.data.currency] || response.data.currency);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        if (e.target.name === 'employeeId') {
            if (existingEmployeeIds?.includes(e.target.value) && e.target.value !== staff?.employeeId) {
                setValidationErrors(prev => ({ ...prev, employeeId: 'Employee ID already exists' }));
            } else {
                setValidationErrors(prev => ({ ...prev, employeeId: '' }));
            }
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.values(validationErrors).some(err => err)) return;
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
                leaveBalance: formData.leaveBalance ? parseFloat(formData.leaveBalance) : 0,
                standardPayableHours: formData.standardPayableHours ? parseFloat(formData.standardPayableHours) : 0,
                bankDetails: (formData.bankName || formData.accountNumber) ? {
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    ifscCode: formData.ifscCode,
                    accountHolderName: formData.accountHolderName,
                } : undefined,
                homeLocation: (formData.homeLocationLat && formData.homeLocationLng) ? {
                    label: formData.homeLocationLabel || 'Home',
                    coordinates: {
                        latitude: parseFloat(formData.homeLocationLat),
                        longitude: parseFloat(formData.homeLocationLng)
                    },
                    radius: parseInt(formData.homeLocationRadius) || 150
                } : undefined,
            };

            const formDataToSend = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value === undefined) return;
                if (typeof value === 'object') {
                    formDataToSend.append(key, JSON.stringify(value));
                } else {
                    formDataToSend.append(key, value.toString());
                }
            });

            if (profilePhoto) {
                formDataToSend.append('profilePhoto', profilePhoto);
            }

            if (isEdit) {
                await staffService.update(staff._id, formDataToSend);

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
                const response: any = await staffService.create(formDataToSend);

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
                    <button
                        onClick={() => onClose()}
                        className="close-button"
                        aria-label="Close"
                        style={{ color: '#ef4444' }}
                    >
                        <X size={24} />
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
                            <div className="profile-photo-upload" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div className="photo-preview" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                                    {photoPreview ? (
                                        <img src={getPhotoUrl(photoPreview)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={40} color="#9ca3af" />
                                    )}
                                </div>
                                <div className="photo-actions">
                                    <label htmlFor="photo-input" style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: 'var(--accent)', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                    </label>
                                    <input
                                        id="photo-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        style={{ display: 'none' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>JPG, PNG allowed. Max 5MB.</p>
                                </div>
                            </div>
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
                                            style={validationErrors.employeeId ? { borderColor: '#ef4444' } : {}}
                                        />
                                    </div>
                                    {validationErrors.employeeId && (
                                        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                            {validationErrors.employeeId}
                                        </p>
                                    )}
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
                                            {customRoles.map((r, idx) => (
                                                <option key={idx} value={r.name}>{r.name} (Acts as {r.accessLevel})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="input-hint">System access level</p>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="hourlyRate">Hourly Rate ({currencySymbol}) <span className="required">*</span></label>
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

                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="leaveBalance">Leave Balance (Days)</label>
                                    <div className="input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input
                                            id="leaveBalance"
                                            name="leaveBalance"
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            placeholder="e.g. 14"
                                            value={formData.leaveBalance}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <p className="input-hint">Total available leave days</p>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="standardPayableHours">Standard Payable Hours / Month</label>
                                    <div className="input-wrapper">
                                        <Clock className="input-icon" size={18} />
                                        <input
                                            id="standardPayableHours"
                                            name="standardPayableHours"
                                            type="number"
                                            step="1"
                                            min="0"
                                            placeholder="e.g. 160"
                                            value={formData.standardPayableHours}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <p className="input-hint">For checking monthly payroll</p>
                                </div>
                            </div>
                        </div>

                        {/* Home Location Configuration Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <MapPin size={18} />
                                Home Location Check-In
                            </h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="homeLocationLabel">Label</label>
                                    <div className="input-wrapper">
                                        <Building2 className="input-icon" size={18} />
                                        <input
                                            id="homeLocationLabel"
                                            name="homeLocationLabel"
                                            type="text"
                                            placeholder="e.g. Smith's Home"
                                            value={formData.homeLocationLabel}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="homeLocationRadius">Geofence Radius (meters)</label>
                                    <div className="input-wrapper">
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            id="homeLocationRadius"
                                            name="homeLocationRadius"
                                            type="number"
                                            step="1"
                                            min="10"
                                            placeholder="e.g. 150"
                                            value={formData.homeLocationRadius}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label htmlFor="homeLocationLat">Latitude</label>
                                    <div className="input-wrapper">
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            id="homeLocationLat"
                                            name="homeLocationLat"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 10.5893"
                                            value={formData.homeLocationLat}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="homeLocationLng">Longitude</label>
                                    <div className="input-wrapper">
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            id="homeLocationLng"
                                            name="homeLocationLng"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 76.093"
                                            value={formData.homeLocationLng}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="input-hint" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                Configure this to allow the employee to check in from this specific location.
                            </p>
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

                    <div className="modal-footer" style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 0' }}>
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="btn"
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: '500' }}
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
