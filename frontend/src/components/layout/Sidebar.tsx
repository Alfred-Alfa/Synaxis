import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { isAdmin, user } = useAuth();

    const adminLinks = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/admin/staff', label: 'Staff Management', icon: '👥' },
        { to: '/admin/time-entries', label: 'Time Entries', icon: '⏰' },
        { to: '/admin/overtime', label: 'Overtime', icon: '⏱️' },
        { to: '/admin/leave', label: 'Leave Requests', icon: '🏖️' },
        { to: '/admin/sites', label: 'Sites/Projects', icon: '🏢' },
        { to: '/admin/payroll', label: 'Payroll', icon: '💰' },
        { to: '/admin/reports', label: 'Reports & Analytics', icon: '📉' },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
    ];

    const staffLinks = [
        { to: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/staff/time-entries', label: 'Time Entries', icon: '⏰' },
        { to: '/staff/overtime', label: 'Overtime', icon: '⏱️' },
        { to: '/staff/leave', label: 'Leave', icon: '🏖️' },
    ];

    const myAppsLinks = [
        { to: '/staff/time-entries', label: 'My Time Entries', icon: '⏱️' },
        { to: '/staff/overtime', label: 'My Overtime', icon: '⌚' },
        { to: '/staff/leave', label: 'My Leave', icon: '🏖️' },
    ];

    const settingsLink = { to: '/admin/settings', label: 'Settings', icon: '⚙️' };

    const links = isAdmin
        ? [
            ...adminLinks,
            ...(user?.role === 'SuperAdmin' ? [] : myAppsLinks),
            settingsLink
        ]
        : staffLinks;

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => {
                                if (window.innerWidth <= 768) {
                                    onClose();
                                }
                            }}
                        >
                            <span className="sidebar-icon">{link.icon}</span>
                            <span className="sidebar-label">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};
