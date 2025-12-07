import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { adminService, type AdminUser } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import type { /* Settings */ } from '../../types';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        companyName: '',
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

    // Admin Management State
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [addingAdmin, setAddingAdmin] = useState(false);

    useEffect(() => {
        loadSettings();
        if (user?.role === 'SuperAdmin') {
            loadAdmins();
        }
    }, [user?.role]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsService.get();
            const data = response.data;
            if (data) {
                setFormData({
                    companyName: data.companyName || '',
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
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const loadAdmins = async () => {
        try {
            setLoadingAdmins(true);
            const response = await adminService.getAll();
            if (response.success && response.data) {
                setAdmins(response.data);
            }
        } catch (err: any) {
            console.error('Failed to load admins', err);
        } finally {
            setLoadingAdmins(false);
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
                timezone: formData.timezone,
                currency: formData.currency as any,
                globalOtRate: parseFloat(formData.defaultOtRate),
                companyAddress: formData.companyAddress
            });
            setSuccess('Settings updated successfully!');
            loadSettings();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setAddingAdmin(true);

        try {
            await adminService.create({
                email: newAdmin.email,
                password: newAdmin.password
            });
            setSuccess('Admin created successfully!');
            setNewAdmin({ email: '', password: '', name: '' });
            loadAdmins();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create admin');
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this admin?')) return;

        try {
            await adminService.delete(id);
            setSuccess('Admin deleted successfully');
            loadAdmins();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete admin');
        }
    };

    // List of countries with flags
    const countries = [
        { name: "Afghanistan", flag: "🇦🇫" },
        { name: "Albania", flag: "🇦🇱" },
        { name: "Algeria", flag: "🇩🇿" },
        { name: "Andorra", flag: "🇦🇩" },
        { name: "Angola", flag: "🇦🇴" },
        { name: "Antigua and Barbuda", flag: "🇦🇬" },
        { name: "Argentina", flag: "🇦🇷" },
        { name: "Armenia", flag: "🇦🇲" },
        { name: "Australia", flag: "🇦🇺" },
        { name: "Austria", flag: "🇦🇹" },
        { name: "Azerbaijan", flag: "🇦🇿" },
        { name: "Bahamas", flag: "🇧🇸" },
        { name: "Bahrain", flag: "🇧🇭" },
        { name: "Bangladesh", flag: "🇧🇩" },
        { name: "Barbados", flag: "🇧🇧" },
        { name: "Belarus", flag: "🇧🇾" },
        { name: "Belgium", flag: "🇧🇪" },
        { name: "Belize", flag: "🇧🇿" },
        { name: "Benin", flag: "🇧🇯" },
        { name: "Bhutan", flag: "🇧🇹" },
        { name: "Bolivia", flag: "🇧🇴" },
        { name: "Bosnia and Herzegovina", flag: "🇧🇦" },
        { name: "Botswana", flag: "🇧🇼" },
        { name: "Brazil", flag: "🇧🇷" },
        { name: "Brunei", flag: "🇧🇳" },
        { name: "Bulgaria", flag: "🇧🇬" },
        { name: "Burkina Faso", flag: "🇧🇫" },
        { name: "Burundi", flag: "🇧🇮" },
        { name: "Cabo Verde", flag: "🇨🇻" },
        { name: "Cambodia", flag: "🇰🇭" },
        { name: "Cameroon", flag: "🇨🇲" },
        { name: "Canada", flag: "🇨🇦" },
        { name: "Central African Republic", flag: "🇨🇫" },
        { name: "Chad", flag: "🇹🇩" },
        { name: "Chile", flag: "🇨🇱" },
        { name: "China", flag: "🇨🇳" },
        { name: "Colombia", flag: "🇨🇴" },
        { name: "Comoros", flag: "🇰🇲" },
        { name: "Congo (Congo-Brazzaville)", flag: "🇨🇬" },
        { name: "Costa Rica", flag: "🇨🇷" },
        { name: "Croatia", flag: "🇭🇷" },
        { name: "Cuba", flag: "🇨🇺" },
        { name: "Cyprus", flag: "🇨🇾" },
        { name: "Czechia (Czech Republic)", flag: "🇨🇿" },
        { name: "Democratic Republic of the Congo", flag: "🇨🇩" },
        { name: "Denmark", flag: "🇩🇰" },
        { name: "Djibouti", flag: "🇩🇯" },
        { name: "Dominica", flag: "🇩🇲" },
        { name: "Dominican Republic", flag: "🇩🇴" },
        { name: "Ecuador", flag: "🇪🇨" },
        { name: "Egypt", flag: "🇪🇬" },
        { name: "El Salvador", flag: "🇸🇻" },
        { name: "Equatorial Guinea", flag: "🇬🇶" },
        { name: "Eritrea", flag: "🇪🇷" },
        { name: "Estonia", flag: "🇪🇪" },
        { name: "Eswatini", flag: "🇸🇿" },
        { name: "Ethiopia", flag: "🇪🇹" },
        { name: "Fiji", flag: "🇫🇯" },
        { name: "Finland", flag: "🇫🇮" },
        { name: "France", flag: "🇫🇷" },
        { name: "Gabon", flag: "🇬🇦" },
        { name: "Gambia", flag: "🇬🇲" },
        { name: "Georgia", flag: "🇬🇪" },
        { name: "Germany", flag: "🇩🇪" },
        { name: "Ghana", flag: "🇬🇭" },
        { name: "Greece", flag: "🇬🇷" },
        { name: "Grenada", flag: "🇬🇩" },
        { name: "Guatemala", flag: "🇬🇹" },
        { name: "Guinea", flag: "🇬🇳" },
        { name: "Guinea-Bissau", flag: "🇬🇼" },
        { name: "Guyana", flag: "🇬🇾" },
        { name: "Haiti", flag: "🇭🇹" },
        { name: "Holy See", flag: "🇻🇦" },
        { name: "Honduras", flag: "🇭🇳" },
        { name: "Hungary", flag: "🇭🇺" },
        { name: "Iceland", flag: "🇮🇸" },
        { name: "India", flag: "🇮🇳" },
        { name: "Indonesia", flag: "🇮🇩" },
        { name: "Iran", flag: "🇮🇷" },
        { name: "Iraq", flag: "🇮🇶" },
        { name: "Ireland", flag: "🇮🇪" },
        { name: "Israel", flag: "🇮🇱" },
        { name: "Italy", flag: "🇮🇹" },
        { name: "Jamaica", flag: "🇯🇲" },
        { name: "Japan", flag: "🇯🇵" },
        { name: "Jordan", flag: "🇯🇴" },
        { name: "Kazakhstan", flag: "🇰🇿" },
        { name: "Kenya", flag: "🇰🇪" },
        { name: "Kiribati", flag: "🇰🇮" },
        { name: "Kuwait", flag: "🇰🇼" },
        { name: "Kyrgyzstan", flag: "🇰🇬" },
        { name: "Laos", flag: "🇱🇦" },
        { name: "Latvia", flag: "🇱🇻" },
        { name: "Lebanon", flag: "🇱🇧" },
        { name: "Lesotho", flag: "🇱🇸" },
        { name: "Liberia", flag: "🇱🇷" },
        { name: "Libya", flag: "🇱🇾" },
        { name: "Liechtenstein", flag: "🇱🇮" },
        { name: "Lithuania", flag: "🇱🇹" },
        { name: "Luxembourg", flag: "🇱🇺" },
        { name: "Madagascar", flag: "🇲🇬" },
        { name: "Malawi", flag: "🇲🇼" },
        { name: "Malaysia", flag: "🇲🇾" },
        { name: "Maldives", flag: "🇲🇻" },
        { name: "Mali", flag: "🇲🇱" },
        { name: "Malta", flag: "🇲🇹" },
        { name: "Marshall Islands", flag: "🇲🇭" },
        { name: "Mauritania", flag: "🇲🇷" },
        { name: "Mauritius", flag: "🇲🇺" },
        { name: "Mexico", flag: "🇲🇽" },
        { name: "Micronesia", flag: "🇫🇲" },
        { name: "Moldova", flag: "🇲🇩" },
        { name: "Monaco", flag: "🇲🇨" },
        { name: "Mongolia", flag: "🇲🇳" },
        { name: "Montenegro", flag: "🇲🇪" },
        { name: "Morocco", flag: "🇲🇦" },
        { name: "Mozambique", flag: "🇲🇿" },
        { name: "Myanmar (formerly Burma)", flag: "🇲🇲" },
        { name: "Namibia", flag: "🇳🇦" },
        { name: "Nauru", flag: "🇳🇷" },
        { name: "Nepal", flag: "🇳🇵" },
        { name: "Netherlands", flag: "🇳🇱" },
        { name: "New Zealand", flag: "🇳🇿" },
        { name: "Nicaragua", flag: "🇳🇮" },
        { name: "Niger", flag: "🇳🇪" },
        { name: "Nigeria", flag: "🇳🇬" },
        { name: "North Korea", flag: "🇰🇵" },
        { name: "North Macedonia", flag: "🇲🇰" },
        { name: "Norway", flag: "🇳🇴" },
        { name: "Oman", flag: "🇴🇲" },
        { name: "Pakistan", flag: "🇵🇰" },
        { name: "Palau", flag: "🇵🇼" },
        { name: "Palestine State", flag: "🇵🇸" },
        { name: "Panama", flag: "🇵🇦" },
        { name: "Papua New Guinea", flag: "🇵🇬" },
        { name: "Paraguay", flag: "🇵🇾" },
        { name: "Peru", flag: "🇵🇪" },
        { name: "Philippines", flag: "🇵🇭" },
        { name: "Poland", flag: "🇵🇱" },
        { name: "Portugal", flag: "🇵🇹" },
        { name: "Qatar", flag: "🇶🇦" },
        { name: "Romania", flag: "🇷🇴" },
        { name: "Russia", flag: "🇷🇺" },
        { name: "Rwanda", flag: "🇷🇼" },
        { name: "Saint Kitts and Nevis", flag: "🇰🇳" },
        { name: "Saint Lucia", flag: "🇱🇨" },
        { name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
        { name: "Samoa", flag: "🇼🇸" },
        { name: "San Marino", flag: "🇸🇲" },
        { name: "Sao Tome and Principe", flag: "🇸🇹" },
        { name: "Saudi Arabia", flag: "🇸🇦" },
        { name: "Senegal", flag: "🇸🇳" },
        { name: "Serbia", flag: "🇷🇸" },
        { name: "Seychelles", flag: "🇸🇨" },
        { name: "Sierra Leone", flag: "🇸🇱" },
        { name: "Singapore", flag: "🇸🇬" },
        { name: "Slovakia", flag: "🇸🇰" },
        { name: "Slovenia", flag: "🇸🇮" },
        { name: "Solomon Islands", flag: "🇸🇧" },
        { name: "Somalia", flag: "🇸🇴" },
        { name: "South Africa", flag: "🇿🇦" },
        { name: "South Korea", flag: "🇰🇷" },
        { name: "South Sudan", flag: "🇸🇸" },
        { name: "Spain", flag: "🇪🇸" },
        { name: "Sri Lanka", flag: "🇱🇰" },
        { name: "Sudan", flag: "🇸🇩" },
        { name: "Suriname", flag: "🇸🇷" },
        { name: "Sweden", flag: "🇸🇪" },
        { name: "Switzerland", flag: "🇨🇭" },
        { name: "Syria", flag: "🇸🇾" },
        { name: "Tajikistan", flag: "🇹🇯" },
        { name: "Tanzania", flag: "🇹🇿" },
        { name: "Thailand", flag: "🇹🇭" },
        { name: "Timor-Leste", flag: "🇹🇱" },
        { name: "Togo", flag: "🇹🇬" },
        { name: "Tonga", flag: "🇹🇴" },
        { name: "Trinidad and Tobago", flag: "🇹🇹" },
        { name: "Tunisia", flag: "🇹🇳" },
        { name: "Turkey", flag: "🇹🇷" },
        { name: "Turkmenistan", flag: "🇹🇲" },
        { name: "Tuvalu", flag: "🇹🇻" },
        { name: "Uganda", flag: "🇺🇬" },
        { name: "Ukraine", flag: "🇺🇦" },
        { name: "United Arab Emirates", flag: "🇦🇪" },
        { name: "United Kingdom", flag: "🇬🇧" },
        { name: "United States of America", flag: "🇺🇸" },
        { name: "Uruguay", flag: "🇺🇾" },
        { name: "Uzbekistan", flag: "🇺🇿" },
        { name: "Vanuatu", flag: "🇻🇺" },
        { name: "Venezuela", flag: "🇻🇪" },
        { name: "Vietnam", flag: "🇻🇳" },
        { name: "Yemen", flag: "🇾🇪" },
        { name: "Zambia", flag: "🇿🇲" },
        { name: "Zimbabwe", flag: "🇿🇼" }
    ];

    if (loading) {
        return <div className="loading">Loading settings...</div>;
    }

    return (
        <div className="settings-page fade-in">
            <div className="page-header">
                <div>
                    <h1>System Settings</h1>
                    <p className="text-muted">Configure your company profile and system preferences</p>
                </div>
            </div>

            {error && (
                <div className="error-alert mb-3">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-alert mb-3">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="settings-grid">
                    {/* Left Column: Company Profile */}
                    <div className="settings-column">
                        <section className="card mb-4">
                            <h3 className="card-title">Company Identity</h3>

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
                                            <div className="logo-placeholder-icon">🏢</div>
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
                                        <label htmlFor="logo-upload" className="btn btn-outline-primary btn-sm">
                                            Change Logo
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
                                        <p className="text-xs text-muted mt-1">Recommended: 200x200px</p>
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
                        </section>

                        <section className="card mb-4">
                            <h3 className="card-title">Company Address</h3>
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
                                        placeholder="New York"
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
                                        placeholder="NY"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ZIP / Postal Code</label>
                                    <input
                                        name="address.zip"
                                        type="text"
                                        className="input"
                                        value={formData.companyAddress.zip}
                                        onChange={handleChange}
                                        placeholder="10001"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <select
                                        name="address.country"
                                        className="select"
                                        value={formData.companyAddress.country}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(country => (
                                            <option key={country.name} value={country.name}>
                                                {country.flag} {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: System Config */}
                    <div className="settings-column">
                        <section className="card mb-4">
                            <h3 className="card-title">Regional & Localization</h3>
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
                                        <option value="Australia/Sydney">Sydney</option>
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
                                        <option value="AUD">AUD (A$)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="card mb-4">
                            <h3 className="card-title">Payroll Configuration</h3>
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
                                <p className="text-xs text-muted mt-1">Default multiplier for OT calculation. Can be overridden per employee.</p>
                            </div>
                        </section>

                        <div className="form-actions text-right">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={saving}
                            >
                                {saving ? 'Saving Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Admin Management Section (Full Width) */}
            {user?.role === 'SuperAdmin' && (
                <section className="card mt-4">
                    <div className="card-header-flex">
                        <div>
                            <h3 className="card-title mb-1">Administrator Access</h3>
                            <p className="text-muted text-sm">Manage users with administrative privileges.</p>
                        </div>
                    </div>

                    <div className="admin-management-layout">
                        {/* List */}
                        <div className="admins-list-panel">
                            {loadingAdmins ? (
                                <p>Loading...</p>
                            ) : (
                                <table className="table admin-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Added On</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center text-muted p-4">No additional admins.</td></tr>
                                        ) : admins.map((admin) => (
                                            <tr key={admin._id}>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-avatar">{admin.email[0].toUpperCase()}</div>
                                                        <span>{admin.email}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${admin.role === 'SuperAdmin' ? 'badge-primary' : 'badge-info'}`}>
                                                        {admin.role}
                                                    </span>
                                                </td>
                                                <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                                                <td className="text-right">
                                                    {admin.role !== 'SuperAdmin' && (
                                                        <button
                                                            className="btn-icon text-danger"
                                                            onClick={() => handleDeleteAdmin(admin._id)}
                                                            title="Remove Admin"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Add Form */}
                        <div className="add-admin-panel">
                            <h4 className="panel-title">Grant Access</h4>
                            <div className="form-group">
                                <label className="text-xs font-bold">Email Address</label>
                                <input
                                    type="email"
                                    className="input input-sm"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    placeholder="colleague@company.com"
                                />
                            </div>
                            <div className="form-group">
                                <label className="text-xs font-bold">Password</label>
                                <input
                                    type="password"
                                    className="input input-sm"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    placeholder="******"
                                />
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm btn-block mt-2"
                                onClick={handleAddAdmin}
                                disabled={addingAdmin || !newAdmin.email || !newAdmin.password}
                            >
                                {addingAdmin ? 'Adding...' : 'Add Administrator'}
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
