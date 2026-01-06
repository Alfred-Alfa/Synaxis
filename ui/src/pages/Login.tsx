import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);

            // Get user role from localStorage to determine redirect
            const userStr = localStorage.getItem('hrms_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === 'Staff') {
                    navigate('/staff/dashboard');
                } else {
                    navigate('/admin/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <div className="login-card fade-in">
                    <div className="login-header">
                        <div className="brand-logo-small">
                            <div className="logo-square">W</div>
                        </div>
                        <h1>Webgeon HRMS</h1>
                        <p>Enter your credentials to access your account</p>
                    </div>

                    {error && (
                        <div className="error-alert">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    className="input icon-padding"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="password-label-row">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                            </div>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input
                                    id="password"
                                    type="password"
                                    className="input icon-padding"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="forgot-password-link">
                                <button
                                    type="button"
                                    className="text-link"
                                    onClick={() => setShowForgotModal(true)}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-login"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p className="footer-copyright">
                            © 2026 Webgeon Results Pvt Ltd
                        </p>
                    </div>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={showForgotModal}
                onClose={() => setShowForgotModal(false)}
            />
        </div>
    );
};
