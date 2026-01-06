import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { SmokeyBackground, LoginForm } from '../components/ui/login-form';
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
        <>
            <main className="relative w-screen h-screen bg-gray-900">
                <SmokeyBackground className="absolute inset-0" />
                <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
                    <LoginForm
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        onSubmit={handleSubmit}
                        loading={loading}
                        error={error}
                        onForgotPassword={() => setShowForgotModal(true)}
                    />
                </div>
            </main>
            <ForgotPasswordModal
                isOpen={showForgotModal}
                onClose={() => setShowForgotModal(false)}
            />
        </>
    );
};
