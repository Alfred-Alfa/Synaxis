import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, CheckCircle, X, AlertCircle } from 'lucide-react';
import { passwordService } from '../../services/passwordService';
import './ForgotPasswordModal.css';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await passwordService.requestReset(email);
            setMessage('If an account exists with this email, a password reset link has been sent.');
            setEmail('');
        } catch (err: any) {
            setError('Failed to process request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="forgot-password-modal-overlay">
            <div className="forgot-password-modal-container">
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="forgot-password-header">
                    <h2>Forgot Password?</h2>
                    <p>Enter your email to receive a password reset link.</p>
                </div>

                <div className="forgot-password-body">
                    {message ? (
                        <div className="success-message">
                            <CheckCircle size={48} className="success-icon" />
                            <p>{message}</p>
                            <p className="note">Please check your inbox (and spam folder).</p>
                            <button className="btn btn-primary btn-block" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-alert">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="reset-email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        id="reset-email"
                                        type="email"
                                        className="input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={loading}
                            >
                                {loading ? 'Sending Request...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="forgot-password-footer">
                    <p>If you forgot your email, please contact your administrator.</p>
                </div>
            </div>
        </div>,
        document.body
    );
};
