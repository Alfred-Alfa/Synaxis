import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import './SettingsPage.css';
import {
    Building2,
    Globe,
    Wallet,
    Shield,
    Save,
    Upload,
    CheckCircle2,
    Plus,
    Mail,
    Trash2,
    Users,
    Key,
    Crown,
    UserPlus,
    X
} from 'lucide-react';
import { adminService, type AdminUser } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
    const { user, isSuperAdmin } = useAuth();
    const [formData, setFormData] = useState({
        companyName: '',
        companyEmail: '',
        phoneCountryCode: '+1',
        companyPhone: '',
        timezone: '',
        currency: '',
        defaultOtRate: '',
        companyAddress: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: ''
        }
    });
    const [companyLogo, setCompanyLogo] = useState<string>('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Roles state
    const [customRoles, setCustomRoles] = useState<{ name: string, accessLevel: 'SuperAdmin' | 'Admin' | 'Staff', description?: string }[]>([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRole, setNewRole] = useState<{ name: string, accessLevel: 'SuperAdmin' | 'Admin' | 'Staff', description: string }>({ name: '', accessLevel: 'Staff', description: '' });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsService.get();
            const data = response.data;
            if (data) {
                setFormData({
                    companyName: data.companyName || '',
                    companyEmail: data.companyEmail || '',
                    phoneCountryCode: data.phoneCountryCode || '+1',
                    companyPhone: data.companyPhone || '',
                    timezone: data.timezone || 'UTC',
                    currency: data.currency || 'USD',
                    defaultOtRate: data.globalOtRate?.toString() || '1.5',
                    companyAddress: {
                        street: data.companyAddress?.street || '',
                        city: data.companyAddress?.city || '',
                        state: data.companyAddress?.state || '',
                        zip: data.companyAddress?.zip || '',
                        country: data.companyAddress?.country || ''
                    }
                });
                setCompanyLogo(data.companyLogo || '');
                setCustomRoles(data.customRoles || []);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                companyAddress: {
                    ...prev.companyAddress,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile) return;

        setError('');
        setSuccess('');
        setUploadingLogo(true);

        try {
            await settingsService.uploadLogo(logoFile);
            setSuccess('Logo uploaded successfully!');
            setLogoFile(null);
            setLogoPreview('');
            loadSettings();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            await settingsService.update({
                companyName: formData.companyName,
                companyEmail: formData.companyEmail,
                phoneCountryCode: formData.phoneCountryCode,
                companyPhone: formData.companyPhone,
                timezone: formData.timezone,
                currency: formData.currency as any,
                globalOtRate: parseFloat(formData.defaultOtRate),
                companyAddress: formData.companyAddress,
                customRoles: customRoles
            });
            setSuccess('Settings updated successfully!');
            loadSettings();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-state">Loading configuration...</div>;
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header-row mb-6">
                <div>
                    <h1>System Settings</h1>
                    <p className="text-muted">Configure your company profile and system preferences</p>
                </div>
            </div>

            <div className="mb-4">
                <span className="badge badge-info" style={{ padding: '0.5rem 1rem' }}>
                    Logged in as: <strong>{user?.email}</strong> ({user?.role})
                </span>
            </div>

            {error && <div className="alert alert-error mb-4">{error}</div>}
            {success && <div className="alert alert-success mb-4">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="settings-grid">
                    {/* Left Column: Company Profile */}
                    <div className="settings-column">
                        <section className="card mb-4 section-card">
                            <div className="card-header-simple">
                                <Building2 size={20} className="section-icon" />
                                <h3>Company Identity</h3>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Company Logo</label>
                                <div className="logo-upload-wrapper">
                                    <div className="logo-preview-box">
                                        {(logoPreview || companyLogo) ? (
                                            <img
                                                src={logoPreview || `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${companyLogo}`}
                                                alt="Company Logo"
                                                className="logo-img"
                                            />
                                        ) : (
                                            <div className="logo-placeholder-icon">
                                                <Building2 size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="logo-actions">
                                        <input
                                            type="file"
                                            id="logo-upload"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="hidden-input"
                                        />
                                        <label htmlFor="logo-upload" className="btn btn-outline btn-sm">
                                            <Upload size={14} /> Change Logo
                                        </label>
                                        {logoFile && (
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm ml-2"
                                                onClick={handleLogoUpload}
                                                disabled={uploadingLogo}
                                            >
                                                {uploadingLogo ? '...' : 'Upload'}
                                            </button>
                                        )}
                                        <p className="helper-text mt-2">Recommended: 200x200px</p>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="companyName" className="form-label">Company Name</label>
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    className="input"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="Enter company name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="companyEmail" className="form-label">Company Email</label>
                                <input
                                    id="companyEmail"
                                    name="companyEmail"
                                    type="email"
                                    className="input"
                                    value={formData.companyEmail}
                                    onChange={handleChange}
                                    placeholder="contact@company.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="companyPhone" className="form-label">Phone Number</label>
                                <div className="input-group">
                                    <select
                                        name="phoneCountryCode"
                                        className="select code-select"
                                        value={formData.phoneCountryCode}
                                        onChange={handleChange}
                                    >
                                        <option value="+1">+1 (US/CA)</option>
                                        <option value="+44">+44 (UK)</option>
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+971">+971 (UAE)</option>
                                        <option value="+65">+65 (SG)</option>
                                        <option value="+61">+61 (AU)</option>
                                    </select>
                                    <input
                                        id="companyPhone"
                                        name="companyPhone"
                                        type="tel"
                                        className="input"
                                        value={formData.companyPhone}
                                        onChange={handleChange}
                                        placeholder="1234567890"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="card mb-4 section-card">
                            <div className="card-header-simple">
                                <Building2 size={20} className="section-icon" />
                                <h3>Company Address</h3>
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group span-2">
                                    <label className="form-label">Street Address</label>
                                    <input
                                        name="address.street"
                                        type="text"
                                        className="input"
                                        value={formData.companyAddress.street}
                                        onChange={handleChange}
                                        placeholder="123 Business Rd"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input
                                        name="address.city"
                                        type="text"
                                        className="input"
                                        value={formData.companyAddress.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State/Province</label>
                                    <input
                                        name="address.state"
                                        type="text"
                                        className="input"
                                        value={formData.companyAddress.state}
                                        onChange={handleChange}
                                        placeholder="State"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ZIP Code</label>
                                    <input
                                        name="address.zip"
                                        type="text"
                                        className="input"
                                        value={formData.companyAddress.zip}
                                        onChange={handleChange}
                                        placeholder="Postal Code"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input
                                        name="address.country"
                                        type="text"
                                        className="input"
                                        value={formData.companyAddress.country}
                                        onChange={handleChange}
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: System Config */}
                    <div className="settings-column">
                        <section className="card mb-4 section-card">
                            <div className="card-header-simple">
                                <Globe size={20} className="section-icon" />
                                <h3>Regional & Localization</h3>
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label htmlFor="timezone" className="form-label">Timezone</label>
                                    <select
                                        id="timezone"
                                        name="timezone"
                                        className="select"
                                        value={formData.timezone}
                                        onChange={handleChange}
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">Eastern Time</option>
                                        <option value="America/Chicago">Central Time</option>
                                        <option value="America/Los_Angeles">Pacific Time</option>
                                        <option value="Europe/London">London</option>
                                        <option value="Europe/Paris">Paris</option>
                                        <option value="Asia/Dubai">Dubai</option>
                                        <option value="Asia/Kolkata">India</option>
                                        <option value="Asia/Singapore">Singapore</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="currency" className="form-label">Currency</label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        className="select"
                                        value={formData.currency}
                                        onChange={handleChange}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="AED">AED (د.إ)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="SGD">SGD (S$)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="card mb-4 section-card">
                            <div className="card-header-simple">
                                <Wallet size={20} className="section-icon" />
                                <h3>Payroll Config</h3>
                            </div>
                            <div className="form-group">
                                <label htmlFor="defaultOtRate" className="form-label">Global Overtime Multiplier</label>
                                <div className="input-group">
                                    <input
                                        id="defaultOtRate"
                                        name="defaultOtRate"
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        className="input"
                                        value={formData.defaultOtRate}
                                        onChange={handleChange}
                                    />
                                    <span className="input-suffix">x Hourly Rate</span>
                                </div>
                                <p className="helper-text mt-2">Base multiplier for overtime calculations.</p>
                            </div>
                        </section>

                        <div className="form-actions text-right">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg icon-btn-text"
                                disabled={saving}
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Role Management Section */}
            <section className="card mt-4 section-card">
                <div className="card-header-row">
                    <div className="card-header-simple">
                        <Shield size={20} className="section-icon" />
                        <div>
                            <h3 className="m-0">Roles & Permissions</h3>
                            <p className="text-muted text-sm m-0">Manage system access levels.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm icon-btn-text"
                        onClick={() => setShowRoleModal(true)}
                    >
                        <Plus size={16} />
                        New Role
                    </button>
                </div>

                <div className="table-responsive mt-3">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Access Level</th>
                                <th>Users</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge badge-primary">SuperAdmin</span>
                                    </div>
                                </td>
                                <td className="text-muted">Full System Access</td>
                                <td>
                                    <span className="text-sm">System Admins</span>
                                </td>
                                <td className="text-right">
                                    <span className="badge badge-secondary">Default</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge badge-info admin-badge">Admin</span>
                                    </div>
                                </td>
                                <td className="text-muted">Administrative Access</td>
                                <td>
                                    <span className="text-sm">HR Managers</span>
                                </td>
                                <td className="text-right">
                                    <span className="badge badge-secondary">Default</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge badge-secondary">Staff</span>
                                    </div>
                                </td>
                                <td className="text-muted">Employee Portal Access</td>
                                <td>
                                    <span className="text-sm">All Staff</span>
                                </td>
                                <td className="text-right">
                                    <span className="badge badge-secondary">Default</span>
                                </td>
                            </tr>
                            {customRoles.map((role, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge badge-secondary" style={{ backgroundColor: 'var(--bg2)', color: 'var(--text)' }}>
                                                {role.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-muted">Extends <span className="badge">{role.accessLevel}</span></td>
                                    <td>
                                        <span className="text-sm">{role.description || 'Custom Role'}</span>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-sm text-red"
                                            onClick={() => setCustomRoles(customRoles.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* New Role Modal */}
            {showRoleModal && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, paddingRight: '2rem' }}>Add Custom Role</h3>
                            <button
                                type="button"
                                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                onClick={() => setShowRoleModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-muted mb-4">Create a customized role label extending a base access level.</p>

                        <div className="form-group mb-3">
                            <label className="form-label">Role Name</label>
                            <input
                                className="input"
                                value={newRole.name}
                                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                placeholder="e.g. HR Manager"
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label className="form-label">Base Access Level</label>
                            <select
                                className="select"
                                value={newRole.accessLevel}
                                onChange={(e) => setNewRole({ ...newRole, accessLevel: e.target.value as any })}
                            >
                                <option value="Staff">Staff (Standard Access)</option>
                                <option value="Admin">Admin (Management Access)</option>
                                <option value="SuperAdmin">Super Admin (Full Access)</option>
                            </select>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Description</label>
                            <input
                                className="input"
                                value={newRole.description}
                                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                placeholder="Role description..."
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                                onClick={() => setShowRoleModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    if (newRole.name) {
                                        setCustomRoles([...customRoles, newRole]);
                                        setShowRoleModal(false);
                                        setNewRole({ name: '', accessLevel: 'Staff', description: '' });
                                    }
                                }}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '500' }}
                                disabled={!newRole.name}
                            >
                                Add Role (Remember to Save)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Administrative Users Management - Only for SuperAdmins */}
            {isSuperAdmin && <AdminUsersSection />}

            {/* Email Configuration Section */}
            <EmailConfigSection />
        </div>
    );
};

// Sub-component for Administrative Users Management
const AdminUsersSection: React.FC = () => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const [newAdmin, setNewAdmin] = useState({
        email: '',
        password: '',
        role: 'Admin' as 'Admin' | 'SuperAdmin'
    });

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            const response = await adminService.getAll();
            setAdmins(response.data || []);
        } catch (err: any) {
            console.error('Failed to load admins', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            await adminService.create(newAdmin);
            setSuccess(`Success: ${newAdmin.role} created successfully.`);
            setShowModal(false);
            setNewAdmin({ email: '', password: '', role: 'Admin' });
            loadAdmins();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create admin');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!window.confirm(`Are you sure you want to remove access for ${email}?`)) return;

        try {
            await adminService.delete(id);
            setSuccess('Admin removed successfully');
            loadAdmins();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete admin');
        }
    };

    if (loading && admins.length === 0) return <div className="p-4 text-center">Loading administrators...</div>;

    return (
        <section className="card mt-4 section-card">
            <div className="card-header-row">
                <div className="card-header-simple">
                    <Users size={20} className="section-icon" />
                    <div>
                        <h3 className="m-0">System Administrators</h3>
                        <p className="text-muted text-sm m-0">Manage users with administrative access.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="btn btn-primary btn-sm icon-btn-text"
                    onClick={() => setShowModal(true)}
                >
                    <UserPlus size={16} />
                    Add Administrator
                </button>
            </div>

            {error && <div className="alert alert-error mt-3">{error}</div>}
            {success && <div className="alert alert-success mt-3">{success}</div>}

            <div className="table-responsive mt-3">
                <table className="table">
                    <thead>
                        <tr>
                            <th>User Email</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map((admin) => (
                            <tr key={admin._id}>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar-xs" style={{ background: admin.role === 'SuperAdmin' ? '#fef3c7' : '#e0e7ff', color: admin.role === 'SuperAdmin' ? '#d97706' : '#4338ca', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                            {admin.email.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span>{admin.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${admin.role === 'SuperAdmin' ? 'badge-primary' : 'badge-info admin-badge'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        {admin.role === 'SuperAdmin' ? <Crown size={12} /> : <Shield size={12} />}
                                        {admin.role}
                                    </span>
                                </td>
                                <td className="text-muted text-sm">
                                    {new Date(admin.createdAt).toLocaleDateString()}
                                </td>
                                <td className="text-right">
                                    {admin.role !== 'SuperAdmin' && (
                                        <button
                                            className="btn btn-icon btn-sm text-red"
                                            onClick={() => handleDelete(admin._id, admin.email)}
                                            title="Remove Access"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, paddingRight: '2rem' }}>Add New Administrator</h3>
                            <button
                                type="button"
                                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                onClick={() => setShowModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-muted mb-4">Create a direct login for an administrative user.</p>

                        <form onSubmit={handleCreate}>
                            <div className="form-group mb-3">
                                <label className="form-label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8', zIndex: 5 }} />
                                    <input
                                        type="email"
                                        className="input"
                                        style={{ paddingLeft: '38px', width: '100%' }}
                                        value={newAdmin.email}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                        placeholder="admin@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Login Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8', zIndex: 5 }} />
                                    <input
                                        type="password"
                                        className="input"
                                        style={{ paddingLeft: '38px', width: '100%' }}
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        placeholder="Min 6 characters"
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">System Role</label>
                                <select
                                    className="select"
                                    value={newAdmin.role}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as any })}
                                >
                                    <option value="Admin">Admin (Full Management)</option>
                                    <option value="SuperAdmin">Super Admin (Full Access)</option>
                                </select>
                                <p className="helper-text mt-1 text-xs">
                                    {newAdmin.role === 'SuperAdmin' ? 'SuperAdmins can manage other admins.' : 'Admins can manage employees and payroll.'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '500' }} disabled={saving}>
                                    {saving ? 'Creating...' : 'Create Admin Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

// Sub-component for Email Configuration
const EmailConfigSection: React.FC = () => {
    const [config, setConfig] = useState({
        smtp_host: 'smtp.zeptomail.in',
        smtp_port: '587',
        smtp_user: 'emailapikey',
        smtp_pass: '',
        from_email: '',
        from_name: '',
        is_verified: false,
        is_active: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [showTestModal, setShowTestModal] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadEmailConfig();
    }, []);

    const loadEmailConfig = async () => {
        try {
            setLoading(true);
            const response = await settingsService.getEmailConfig();
            if (response.data) {
                setConfig({
                    ...response.data,
                    smtp_pass: response.data.smtp_pass_masked || '', // Don't show real encrypted pass
                    smtp_port: response.data.smtp_port.toString()
                });
            }
        } catch (error) {
            console.error('Failed to load email config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        // Validation
        // Domain validation removed for multi-tenancy support

        try {
            const payload = {
                ...config,
                smtp_port: parseInt(config.smtp_port)
            };
            const response = await settingsService.updateEmailConfig(payload);
            setMessage({ type: 'success', text: response.message || 'Configuration saved.' });
            loadEmailConfig(); // Reload to get updated status
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to save configuration.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) return;
        setTesting(true);
        setMessage(null);

        try {
            const response = await settingsService.testEmailConfig(testEmail);
            setMessage({ type: 'success', text: response.message || 'Test email sent successfully.' });
            loadEmailConfig(); // Reload to confirm verified status
            setShowTestModal(false);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Test failed. Check your credentials.'
            });
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading email settings...</div>;

    return (
        <section className="card mt-4 section-card">
            <div className="card-header-simple mb-4">
                <div className="d-flex align-items-center gap-2">
                    <Mail size={20} className="section-icon" />
                    <div>
                        <h3 className="m-0">Email Configuration</h3>
                        <p className="text-muted text-sm m-0">Configure SMTP settings (ZeptoMail context supported).</p>
                    </div>
                </div>
                <div className="ml-auto">
                    {config.is_verified ? (
                        <span className="badge badge-success d-flex align-items-center gap-1">
                            <CheckCircle2 size={14} /> Verified & Active
                        </span>
                    ) : (
                        <span className="badge badge-warning">Not Verified</span>
                    )}
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type} mb-4`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div className="form-grid-2">
                    <div className="form-group">
                        <label className="form-label">SMTP Host</label>
                        <input
                            name="smtp_host"
                            className="input"
                            value={config.smtp_host}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">SMTP Port</label>
                        <input
                            name="smtp_port"
                            className="input"
                            value={config.smtp_port}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">SMTP User</label>
                        <input
                            name="smtp_user"
                            className="input"
                            value={config.smtp_user}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">SMTP Password (API Key)</label>
                        <input
                            name="smtp_pass"
                            type="password"
                            className="input"
                            value={config.smtp_pass}
                            // Don't auto-fill if masked
                            onChange={handleChange}
                            placeholder={config.is_verified || config.smtp_pass === '********' ? '********' : 'Enter API Key'}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sender Name</label>
                        <input
                            name="from_name"
                            className="input"
                            value={config.from_name}
                            onChange={handleChange}
                            placeholder="e.g. Acme HR"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sender Email</label>
                        <input
                            name="from_email"
                            className="input"
                            value={config.from_email}
                            onChange={handleChange}
                            placeholder="hrms@syntax.com"
                            required
                        />
                    </div>
                </div>

                <div className="form-actions d-flex justify-content-end gap-3 mt-4">
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowTestModal(true)}
                        disabled={saving}
                    >
                        Send Test Email
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary icon-btn-text"
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </form>

            {/* Test Email Modal */}
            {showTestModal && (
                <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Send Test Email</h3>
                            <button
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                onClick={() => setShowTestModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-muted mb-4">Enter an email address to verify your SMTP configuration.</p>

                        <div className="form-group mb-4">
                            <label className="form-label">Recipient Email</label>
                            <input
                                className="input"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleTest}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '500' }}
                                disabled={testing || !testEmail}
                            >
                                {testing ? 'Sending...' : 'Send Test'}
                            </button>
                            <button
                                type="button"
                                className="btn"
                                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                                onClick={() => setShowTestModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
