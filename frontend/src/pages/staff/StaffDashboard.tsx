import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { leaveService } from '../../services/leaveService';
import type { TimeEntry, Overtime, Leave } from '../../types';

export const StaffDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalHours: 0,
        otHours: 0,
        leaveTaken: 0,
        pendingRequests: 0,
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            // Fetch data for the current month
            const [timeRes, otRes, leaveRes] = await Promise.all([
                timeEntryService.getAll({ startDate: firstDayOfMonth, endDate: lastDayOfMonth }),
                overtimeService.getAll({ startDate: firstDayOfMonth, endDate: lastDayOfMonth }),
                leaveService.getAll() // Get all leave to calculate pending properly, can filter for month if needed
            ]);

            const timeEntries = timeRes.data || [];
            const overtimeEntries = otRes.data || [];
            const leaveEntries = leaveRes.data || [];

            // Calculate totals for current month (Service filters date for time/ot, but let's double check if needed)
            const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.status === 'Approved' ? entry.totalHours : 0), 0);
            const otHours = overtimeEntries.reduce((sum, entry) => sum + (entry.status === 'Approved' ? entry.otHours : 0), 0);

            // Calculate pending requests (across all time, or just this month? Usually pending is all)
            // Note: The services might have only returned this month's data if we passed params. 
            // For Pending count, we ideally want ALL pending. 
            // Let's re-fetch just pending items or filter if we can't.
            // Actually, let's just fetch ALL pending items in a separate call or modify the logic.
            // For simplicity and performance, let's do a separate fetch for "Pending" status for the counter, 
            // or just fetch all for this month + all pending.

            // Revised strategy: Fetch ALL entries for the staff to compute everything locally or make specific calls.
            // Since we don't expect huge data yet, fetching all for the staff is fine.
            // Or better: parallel fetch for stats.

            const [allPendingTime, allPendingOt, allPendingLeave] = await Promise.all([
                timeEntryService.getAll({ status: 'Pending' }),
                overtimeService.getAll({ status: 'Pending' }),
                leaveService.getAll({ status: 'Pending' })
            ]);

            const pendingCount = (allPendingTime.data?.length || 0) +
                (allPendingOt.data?.length || 0) +
                (allPendingLeave.data?.length || 0);

            // For monthly stats, we rely on the date-filtered calls
            // Leave taken this month
            const currentMonthLeave = leaveEntries.filter(leave => {
                const leaveDate = new Date(leave.startDate);
                return leaveDate >= new Date(firstDayOfMonth) && leaveDate <= new Date(lastDayOfMonth) && leave.status === 'Approved';
            });
            const leaveTaken = currentMonthLeave.reduce((sum, leave) => sum + leave.totalDays, 0);

            setStats({
                totalHours,
                otHours,
                leaveTaken,
                pendingRequests: pendingCount
            });

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard fade-in">
            <div className="dashboard-header">
                <h1>Staff Dashboard</h1>
                <p className="text-muted">Welcome, {user?.email}!</p>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <h3>⏰ Total Hours</h3>
                    <p className="stat-number">{stats.totalHours.toFixed(1)}</p>
                    <p className="text-muted text-sm">Approved (This month)</p>
                </div>

                <div className="card">
                    <h3>⏱️ OT Hours</h3>
                    <p className="stat-number">{stats.otHours.toFixed(1)}</p>
                    <p className="text-muted text-sm">Approved (This month)</p>
                </div>

                <div className="card">
                    <h3>🏖️ Leave Taken</h3>
                    <p className="stat-number">{stats.leaveTaken}</p>
                    <p className="text-muted text-sm">Days (This month)</p>
                </div>

                <div className="card">
                    <h3>📋 Pending Requests</h3>
                    <p className="stat-number">{stats.pendingRequests}</p>
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
