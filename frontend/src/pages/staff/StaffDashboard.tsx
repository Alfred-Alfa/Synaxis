import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const StaffDashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard fade-in">
            <div className="dashboard-header">
                <h1>Staff Dashboard</h1>
                <p className="text-muted">Welcome, {user?.email}!</p>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <h3>⏰ Total Hours</h3>
                    <p className="stat-number">-</p>
                    <p className="text-muted text-sm">This month</p>
                </div>

                <div className="card">
                    <h3>⏱️ OT Hours</h3>
                    <p className="stat-number">-</p>
                    <p className="text-muted text-sm">This month</p>
                </div>

                <div className="card">
                    <h3>🏖️ Leave Balance</h3>
                    <p className="stat-number">-</p>
                    <p className="text-muted text-sm">Days available</p>
                </div>

                <div className="card">
                    <h3>📋 Pending Requests</h3>
                    <p className="stat-number">-</p>
                    <p className="text-muted text-sm">Awaiting approval</p>
                </div>
            </div>

            <div className="mt-4">
                <div className="card">
                    <h3 className="mb-3">Quick Actions</h3>
                    <div className="action-grid">
                        <a href="/staff/time-entries" className="action-card">
                            <span className="action-icon">⏰</span>
                            <span>Submit Time Entry</span>
                        </a>
                        <a href="/staff/overtime" className="action-card">
                            <span className="action-icon">⏱️</span>
                            <span>Apply for Overtime</span>
                        </a>
                        <a href="/staff/leave" className="action-card">
                            <span className="action-icon">🏖️</span>
                            <span>Apply for Leave</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
