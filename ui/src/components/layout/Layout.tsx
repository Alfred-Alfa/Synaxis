import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { ForcePasswordChangeModal } from '../auth/ForcePasswordChangeModal';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, refreshUser } = useAuth();
    const [showForcePasswordModal, setShowForcePasswordModal] = useState(false);

    useEffect(() => {
        if (user?.isFirstLogin) {
            setShowForcePasswordModal(true);
        }
    }, [user]);

    const handlePasswordChanged = async () => {
        // Refresh user data to get updated isFirstLogin status
        if (refreshUser) {
            await refreshUser();
        }
        setShowForcePasswordModal(false);
    };

    return (
        <div className="app-layout">
            <Navbar />
            <div className="app-content">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>

            {user && (
                <ForcePasswordChangeModal
                    isOpen={showForcePasswordModal}
                    userEmail={user.email}
                    onPasswordChanged={handlePasswordChanged}
                />
            )}
        </div>
    );
};
