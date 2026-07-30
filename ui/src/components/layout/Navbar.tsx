import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Bell, Moon, Sun, LogOut, Menu, Settings } from 'lucide-react';
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

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <nav className="topbar-v2">
            <div className="topbar-left-v2">
                <button
                    className="icon-btn-v2"
                    onClick={onToggleSidebar}
                    aria-label="Toggle Sidebar"
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <Menu size={20} />
                </button>
                <div className="page-title-v2">{user?.role === 'Staff' ? 'Staff Portal' : 'Admin Portal'}</div>
                <span className="breadcrumb-sep-v2">/</span>
                <div className="date-chip-v2">{dateStr}</div>
            </div>

            <div className="topbar-right-v2">
                <div className="welcome-pill-v2">👋 Welcome, {user?.email?.split('@')[0]}</div>

                <button
                    className="icon-btn-v2"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <div className="icon-btn-v2" title="Notifications" onClick={goToNotifications}>
                    <Bell size={18} />
                    {unreadCount > 0 && <div className="notif-dot-v2"></div>}
                </div>

                <div className="icon-btn-v2" title="Settings" onClick={() => navigate(user?.role === 'Staff' ? '/staff/profile' : '/admin/settings')}>
                    <Settings size={18} />
                </div>

                <div className="icon-btn-v2" title="Logout" onClick={handleLogout}>
                    <LogOut size={18} />
                </div>
            </div>
        </nav>
    );
};
