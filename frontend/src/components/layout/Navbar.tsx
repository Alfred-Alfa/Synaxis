import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService } from '../../services/settingsService';
import { notificationService } from '../../services/notificationService';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('HRMS');
    const [companyLogo, setCompanyLogo] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadSettings();
        // Initial load
        loadNotifications();

        // Poll for notifications every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadSettings = async () => {
        try {
            const response = await settingsService.get();
            if (response.data) {
                setCompanyName(response.data.companyName || 'HRMS');
                setCompanyLogo(response.data.companyLogo || '');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const loadNotifications = async () => {
        try {
            const response = await notificationService.getAll();
            const unread = response.data?.filter((n: any) => !n.isRead).length || 0;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            window.location.href = '/login';
        }
    };

    const goToNotifications = () => {
        if (user?.role === 'Staff') {
            navigate('/staff/notifications');
        } else {
            navigate('/admin/notifications');
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                {companyLogo ? (
                    <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${companyLogo}`}
                        alt={companyName}
                        className="navbar-logo"
                    />
                ) : (
                    <div className="navbar-logo-placeholder">
                        <span className="navbar-logo-icon">🏢</span>
                    </div>
                )}
                <h2>{companyName}</h2>
            </div>

            <div className="navbar-menu">
                <div className="navbar-user">
                    <button
                        className="btn-icon notification-btn"
                        onClick={goToNotifications}
                        title="Notifications"
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </button>

                    <div className="user-info">
                        <span className="user-email">{user?.email}</span>
                        <span className={`user-role badge badge-${user?.role === 'SuperAdmin' || user?.role === 'Admin' ? 'primary' : 'secondary'}`}>
                            {user?.role}
                        </span>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};
