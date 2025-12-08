import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { passwordService } from '../../services/passwordService';
import './ForcePasswordChangeModal.css';

interface ForcePasswordChangeModalProps {
    isOpen: boolean;
    userEmail: string;
    onPasswordChanged: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
    isOpen,
    userEmail,
    onPasswordChanged,
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // First-time password change doesn't require current password
            await passwordService.changePassword(null, newPassword);
            onPasswordChanged();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="force-password-modal-overlay">
            <div className="force-password-modal-container">
                <div className="force-password-modal-header">
                    <div className="header-icon">
                        <Lock size={32} />
                    </div>
                    <h2>🔐 Set Your Password</h2>
                    <p className="subtitle">For security, please set a new password for your account</p>
                </div>

                <div className="force-password-modal-body">
                    <div className="user-info">
                        <strong>Account:</strong> {userEmail}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <small className="hint">Minimum 6 characters</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="password-input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    className="input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'Setting Password...' : 'Set Password & Continue'}
                        </button>
                    </form>

                    <div className="security-note">
                        <strong>⚠️ Important:</strong> You cannot close this dialog until you set a new password. This is required for your account security.
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
