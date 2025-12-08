import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { leaveService } from '../../services/leaveService';
import { siteService } from '../../services/siteService'; // Import siteService
import { Play, Square, MapPin, Clock } from 'lucide-react'; // Import icons

export const StaffDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalHours: 0,
        otHours: 0,
        leaveTaken: 0,
        pendingRequests: 0,
    });

    // Check-in State
    const [activeEntry, setActiveEntry] = useState<any>(null);
    const [sites, setSites] = useState<any[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [checkoutDesc, setCheckoutDesc] = useState('Standard Shift');

    useEffect(() => {
        loadDashboardData();
        loadCheckInData();
    }, []);

    const loadCheckInData = async () => {
        try {
            // Get current active status
            const statusRes = await timeEntryService.getCurrentStatus();
            setActiveEntry(statusRes.data);

            // Get Sites
            const sitesRes = await siteService.getAll({ status: 'Active' });
            setSites(sitesRes.data || []);

            if (sitesRes.data && sitesRes.data.length > 0) {
                setSelectedSiteId(sitesRes.data[0]._id);
            }
        } catch (err) {
            console.error('Failed to load check-in data', err);
        }
    };

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
                leaveService.getAll()
            ]);

            const timeEntries = timeRes.data || [];
            const overtimeEntries = otRes.data || [];
            const leaveEntries = leaveRes.data || [];

            const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.status === 'Approved' ? entry.totalHours : 0), 0);
            const otHours = overtimeEntries.reduce((sum, entry) => sum + (entry.status === 'Approved' ? entry.otHours : 0), 0);

            const [allPendingTime, allPendingOt, allPendingLeave] = await Promise.all([
                timeEntryService.getAll({ status: 'Pending' }),
                overtimeService.getAll({ status: 'Pending' }),
                leaveService.getAll({ status: 'Pending' })
            ]);

            const pendingCount = (allPendingTime.data?.length || 0) +
                (allPendingOt.data?.length || 0) +
                (allPendingLeave.data?.length || 0);

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

    const handleCheckIn = async () => {
        if (!selectedSiteId) return;
        setCheckInLoading(true);
        try {
            const res = await timeEntryService.checkIn({ siteId: selectedSiteId });
            setActiveEntry(res.data);
            // Refresh stats if needed, or just set active
        } catch (err) {
            console.error('Check in failed', err);
            alert('Failed to check in');
        } finally {
            setCheckInLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setCheckInLoading(true);
        try {
            await timeEntryService.checkOut({ jobDescription: checkoutDesc });
            setActiveEntry(null);
            setCheckoutDesc('Standard Shift'); // Reset
            loadDashboardData(); // Refresh stats
            alert('Checked out successfully!');
        } catch (err) {
            console.error('Check out failed', err);
            alert('Failed to check out');
        } finally {
            setCheckInLoading(false);
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

            {/* Check-In/Out Widget */}
            <div className="card mb-4 border-l-4 border-indigo-500">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock className={activeEntry ? "text-green-500" : "text-gray-400"} />
                            {activeEntry ? 'Current Session' : 'Start New Shift'}
                        </h2>
                        {activeEntry ? (
                            <div className="text-sm">
                                <p className="mb-1"><strong>Site:</strong> {activeEntry.siteId?.name || 'Unknown Site'}</p>
                                <p><strong>Started:</strong> {activeEntry.startTime}</p>
                            </div>
                        ) : (
                            <p className="text-muted text-sm">Select a site and start your work timer.</p>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {!activeEntry ? (
                            <>
                                <div style={{ minWidth: '200px' }}>
                                    <label htmlFor="site-select" className="sr-only">Select Site</label>
                                    <div className="relative">
                                        <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#6b7280' }} />
                                        <select
                                            id="site-select"
                                            value={selectedSiteId}
                                            onChange={(e) => setSelectedSiteId(e.target.value)}
                                            className="input"
                                            style={{ paddingLeft: '32px' }}
                                        >
                                            <option value="" disabled>Select Job Site</option>
                                            {sites.map(site => (
                                                <option key={site._id} value={site._id}>{site.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckIn}
                                    disabled={checkInLoading || !selectedSiteId}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                                >
                                    {checkInLoading ? 'Starting...' : <><Play size={18} fill="currentColor" /> Check In</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Work Description (Optional)"
                                    value={checkoutDesc}
                                    onChange={(e) => setCheckoutDesc(e.target.value)}
                                    style={{ minWidth: '250px' }}
                                />
                                <button
                                    onClick={handleCheckOut}
                                    disabled={checkInLoading}
                                    className="btn btn-danger"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                                >
                                    {checkInLoading ? 'Stopping...' : <><Square size={18} fill="currentColor" /> Check Out</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
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
                            <span>Time List</span>
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
