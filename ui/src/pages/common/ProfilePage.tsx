import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { passwordService } from '../../services/passwordService';
import { Lock, User, Mail, Shield, Check, AlertCircle } from 'lucide-react';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await passwordService.changePassword(currentPassword, newPassword);
            setMessage('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <h1 className="page-title">My Profile</h1>

            <div className="profile-grid">
                {/* Profile Info Card */}
                <div className="card profile-info-card">
                    <div className="card-header">
                        <User className="card-icon" />
                        <h2>Profile Information</h2>
                    </div>

                    <div className="info-list">
                        <div className="info-item">
                            <label>Role</label>
                            <div className="role-badge">
                                <Shield size={14} />
                                {user?.role}
                            </div>
                        </div>

                        <div className="info-item">
                            <label>Email Address</label>
                            <div className="value-with-icon">
                                <Mail size={16} />
                                {user?.email}
                            </div>
                        </div>

                        <div className="info-item">
                            <label>User ID</label>
                            <div className="value-mono">{user?.id}</div>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="card password-card">
                    <div className="card-header">
                        <Lock className="card-icon" />
                        <h2>Change Password</h2>
                    </div>

                    <form onSubmit={handlePasswordChange}>
                        {message && (
                            <div className="alert success-alert">
                                <Check size={16} />
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="alert error-alert">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                className="input"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                            <small className="help-text">Minimum 6 characters</small>
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
