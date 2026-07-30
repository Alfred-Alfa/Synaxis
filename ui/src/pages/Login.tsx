import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { LoginForm } from '../components/ui/login-form';
import { isAdminPortal, isStaffPortal } from '../utils/portalMode';
import './Login.css';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const enforcePortalAccess = (role: string): boolean => {
        const isStaff = role === 'Staff';

        if (isAdminPortal() && isStaff) {
            setError(`Staff members must log in at the Employee Portal (${window.location.hostname}:3000). Click the link to go there.`);
            return false;
        }
        if (isStaffPortal() && !isStaff) {
            setError(`Admins must log in at the Admin Portal (${window.location.hostname}:8000). Click the link to go there.`);
            return false;
        }
        return true;
    };

    const handleGoogleLogin = async (token: string) => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle(token);
            const userStr = localStorage.getItem('hrms_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (!enforcePortalAccess(user.role)) return;
                if (user.role === 'Staff') {
                    navigate('/staff/dashboard');
                } else {
                    navigate('/admin/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);

            const userStr = localStorage.getItem('hrms_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (!enforcePortalAccess(user.role)) return;
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

    const portalLabel = isAdminPortal() ? 'Admin Portal' : 'Employee Portal';
    const wrongPortalUrl = isAdminPortal() ? `http://${window.location.hostname}:3000/login` : `http://${window.location.hostname}:8000/login`;
    const wrongPortalLabel = isAdminPortal() ? `Employee Portal (${window.location.hostname}:3000)` : `Admin Portal (${window.location.hostname}:8000)`;

    return (
        <>
            <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                onForgotPassword={() => setShowForgotModal(true)}
                onGoogleLogin={handleGoogleLogin}
                portalLabel={portalLabel}
                wrongPortalUrl={wrongPortalUrl}
                wrongPortalLabel={wrongPortalLabel}
            />
            <ForgotPasswordModal
                isOpen={showForgotModal}
                onClose={() => setShowForgotModal(false)}
            />
        </>
    );
};
