import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import type { /* Settings */ } from '../../types';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
    // const [settings, setSettings] = useState<Settings | null>(null);
    const [formData, setFormData] = useState({
        companyName: '',
        timezone: '',
        currency: '',
        defaultOtRate: '',
        // weekendOtRate: '',
        // nightShiftOtRate: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsService.get();
            const data = response.data;
            // setSettings(data);
            if (data) {
                setFormData({
                    companyName: data.companyName || '',
                    timezone: data.timezone || 'UTC',
                    currency: data.currency || 'USD',
                    defaultOtRate: data.globalOtRate?.toString() || '1.5',
                    // weekendOtRate: '2',
                    // nightShiftOtRate: '1.75',
                });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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
                currency: formData.currency as any, // Cast to any to satisfy specific union type
                globalOtRate: parseFloat(formData.defaultOtRate),
                /*otRates: {
                    default: parseFloat(formData.defaultOtRate),
                    weekend: parseFloat(formData.weekendOtRate),
                    nightShift: parseFloat(formData.nightShiftOtRate),
                },*/
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
        return <div className="loading">Loading settings...</div>;
    }

    return (
        <div className="settings-page fade-in">
            <div className="page-header">
                <div>
                    <h1>System Settings</h1>
                    <p className="text-muted">Configure system-wide settings and preferences</p>
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
                <div className="card mb-3">
                    <h3 className="card-title">Company Information</h3>
                    <div className="form-grid">
                        <div className="form-group form-group-full">
                            <label htmlFor="companyName" className="form-label">
                                Company Name
                            </label>
                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                className="input"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="Your Company Name"
                            />
                        </div>
                    </div>
                </div>

                <div className="card mb-3">
                    <h3 className="card-title">Regional Settings</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="timezone" className="form-label">
                                Timezone *
                            </label>
                            <select
                                id="timezone"
                                name="timezone"
                                className="select"
                                value={formData.timezone}
                                onChange={handleChange}
                                required
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Chicago">Central Time</option>
                                <option value="America/Denver">Mountain Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="Europe/London">London</option>
                                <option value="Europe/Paris">Paris</option>
                                <option value="Asia/Dubai">Dubai</option>
                                <option value="Asia/Kolkata">India</option>
                                <option value="Asia/Singapore">Singapore</option>
                                <option value="Asia/Tokyo">Tokyo</option>
                                <option value="Australia/Sydney">Sydney</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="currency" className="form-label">
                                Currency *
                            </label>
                            <select
                                id="currency"
                                name="currency"
                                className="select"
                                value={formData.currency}
                                onChange={handleChange}
                                required
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="AED">AED (د.إ)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="SGD">SGD (S$)</option>
                                <option value="AUD">AUD (A$)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card mb-3">
                    <h3 className="card-title">Overtime Rate Multipliers</h3>
                    <p className="text-muted mb-3">
                        These are global default rates. Staff-specific and site-specific rates will override these.
                    </p>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="defaultOtRate" className="form-label">
                                Default OT Rate *
                            </label>
                            <input
                                id="defaultOtRate"
                                name="defaultOtRate"
                                type="number"
                                step="0.1"
                                min="1"
                                className="input"
                                value={formData.defaultOtRate}
                                onChange={handleChange}
                                required
                            />
                            <small className="text-muted">e.g., 1.5 for 1.5x hourly rate</small>
                        </div>

                        {/* <div className="form-group">
                            <label htmlFor="weekendOtRate" className="form-label">
                                Weekend OT Rate
                            </label>
                            <input
                                id="weekendOtRate"
                                name="weekendOtRate"
                                type="number"
                                step="0.1"
                                min="1"
                                className="input"
                                value={formData.weekendOtRate}
                                onChange={handleChange}
                            />
                            <small className="text-muted">e.g., 2.0 for double pay</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="nightShiftOtRate" className="form-label">
                                Night Shift OT Rate
                            </label>
                            <input
                                id="nightShiftOtRate"
                                name="nightShiftOtRate"
                                type="number"
                                step="0.1"
                                min="1"
                                className="input"
                                value={formData.nightShiftOtRate}
                                onChange={handleChange}
                            />
                            <small className="text-muted">e.g., 1.75 for 1.75x hourly rate</small>
                        </div> */}
                    </div>
                </div>

                <div className="card-footer">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};
