import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, CheckCircle, X, AlertCircle, KeyRound } from 'lucide-react';
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
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    <X size={20} />
                </button>

                <div className="forgot-password-content">
                    {!message ? (
                        <>
                            <div className="forgot-password-header">
                                <div className="featured-icon">
                                    <KeyRound size={28} />
                                </div>
                                <h2>Forgot password?</h2>
                                <p>No worries, we'll send you reset instructions.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="forgot-password-form">
                                {error && (
                                    <div className="error-message">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="reset-email">Email address</label>
                                    <div className="input-with-icon">
                                        <Mail size={18} />
                                        <input
                                            id="reset-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            required
                                            autoFocus
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending instruction...' : 'Send Reset Link'}
                                </button>
                            </form>

                            <div className="forgot-password-footer">
                                <p>Remember your password? <button onClick={onClose} className="link-text">Back to login</button></p>
                            </div>
                        </>
                    ) : (
                        <div className="success-state">
                            <div className="success-icon-wrapper">
                                <CheckCircle size={32} />
                            </div>
                            <h3>Check your email</h3>
                            <p className="success-desc">{message}</p>
                            <div className="email-sent-to">
                                <span>sent to</span> <strong>{email}</strong>
                            </div>

                            <button className="btn-primary w-full" onClick={onClose}>
                                Back to Login
                            </button>

                            <p className="resend-text">
                                Didn't receive the email? <button onClick={() => { setMessage(''); setLoading(false); }} className="link-text">Click to resend</button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
