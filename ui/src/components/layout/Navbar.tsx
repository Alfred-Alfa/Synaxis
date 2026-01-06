import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Initial load
        loadNotifications();

        // Poll for notifications every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

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
            <div className="navbar-left">
                <button
                    className="nav-icon-btn mobile-menu-btn"
                    onClick={onToggleSidebar}
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>
            </div>

            <div className="navbar-actions">
                <button
                    className="nav-icon-btn"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <button
                    className="nav-icon-btn notification-btn"
                    onClick={goToNotifications}
                    title="Notifications"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </button>

                <div className="divider-vertical"></div>

                <div className="user-profile-section">
                    <div className="user-avatar-circle">
                        <UserIcon size={16} color="white" />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.email?.split('@')[0]}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>

                    <button
                        className="nav-icon-btn logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                        style={{ marginLeft: '12px' }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </nav>
    );
};
