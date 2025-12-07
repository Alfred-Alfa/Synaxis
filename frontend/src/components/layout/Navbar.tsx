import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService } from '../../services/settingsService';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
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

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            window.location.href = '/login';
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
