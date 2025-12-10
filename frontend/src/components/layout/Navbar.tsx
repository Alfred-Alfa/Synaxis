import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService } from '../../services/settingsService';
import { notificationService } from '../../services/notificationService';
import { Bell, Moon, Sun, LogOut, User as UserIcon, Menu } from 'lucide-react';
import './Navbar.css';

import { useTheme } from '../../contexts/ThemeContext';

interface NavbarProps {
    onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
    const { theme, toggleTheme } = useTheme();
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
                <button
                    className="nav-icon-btn mobile-menu-btn"
                    onClick={onToggleSidebar}
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={24} />
                </button>

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

            <div className="navbar-actions">
                <button
                    className="nav-icon-btn"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <button
                    className="nav-icon-btn notification-btn"
                    onClick={goToNotifications}
                    title="Notifications"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </button>

                <div className="divider-vertical"></div>

                <div className="user-profile-section">
                    <div className="user-text">
                        <span className="user-name">{user?.email?.split('@')[0]}</span>
                        <span className="user-role-label">{user?.role}</span>
                    </div>

                    <button
                        className="nav-icon-btn profile-btn"
                        onClick={() => navigate(user?.role === 'Staff' ? '/staff/profile' : '/admin/profile')}
                        title="My Profile"
                    >
                        <UserIcon size={20} />
                    </button>

                    <button
                        className="nav-icon-btn logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};
