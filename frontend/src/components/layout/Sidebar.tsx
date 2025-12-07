import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { isAdmin } = useAuth();

    const adminLinks = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/admin/staff', label: 'Staff Management', icon: '👥' },
        { to: '/admin/time-entries', label: 'Time Entries', icon: '⏰' },
        { to: '/admin/overtime', label: 'Overtime', icon: '⏱️' },
        { to: '/admin/leave', label: 'Leave Requests', icon: '🏖️' },
        { to: '/admin/sites', label: 'Sites/Projects', icon: '🏢' },
        { to: '/admin/payroll', label: 'Payroll', icon: '💰' },
        { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
        { to: '/admin/reports', label: 'Reports & Analytics', icon: '📉' },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
    ];

    const staffLinks = [
        { to: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/staff/time-entries', label: 'Time Entries', icon: '⏰' },
        { to: '/staff/overtime', label: 'Overtime', icon: '⏱️' },
        { to: '/staff/leave', label: 'Leave', icon: '🏖️' },
    ];

    const links = isAdmin ? adminLinks : staffLinks;

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="sidebar-icon">{link.icon}</span>
                        <span className="sidebar-label">{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};
