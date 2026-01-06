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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (user?.isFirstLogin) {
            setShowForcePasswordModal(true);
        }
    }, [user]);

    const handlePasswordChanged = async () => {
        if (refreshUser) {
            await refreshUser();
        }
        setShowForcePasswordModal(false);
    };

    return (
        <div className="layout-root">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="layout-main">
                <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="layout-content">
                    <div className="content-container">
                        {children}
                    </div>
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
