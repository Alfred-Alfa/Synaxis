import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService } from '../../services/settingsService';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { isAdmin } = useAuth();
    const [companyName, setCompanyName] = useState('HRMS');
    const [companyLogo, setCompanyLogo] = useState('');

    useEffect(() => {
        loadSettings();
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

    const adminLinks = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/admin/staff', label: 'Staff Management', icon: '👥' },
        { to: '/admin/time-entries', label: 'Time Entries', icon: '⏰' },
        { to: '/admin/overtime', label: 'Overtime', icon: '⏱️' },
        { to: '/admin/leave', label: 'Leave Requests', icon: '🏖️' },
        { to: '/admin/sites', label: 'Sites/Projects', icon: '🏢' },
        { to: '/admin/payroll', label: 'Payroll', icon: '💰' },
        { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
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
            <div className="sidebar-header">
                {companyLogo ? (
                    <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${companyLogo}`}
                        alt={companyName}
                        className="sidebar-logo"
                    />
                ) : (
                    <div className="sidebar-logo-placeholder">
                        <span className="sidebar-logo-icon">🏢</span>
                    </div>
                )}
                <h2 className="sidebar-company-name">{companyName}</h2>
            </div>
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
