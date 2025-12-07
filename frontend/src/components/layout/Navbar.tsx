import React from 'react';
// import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            window.location.href = '/login';
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h2>HRMS</h2>
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
