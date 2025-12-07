import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import type { Leave, Staff } from '../../types';
import { LeaveCalendar } from '../../components/LeaveCalendar';
import './AdminTimeEntry.css';

export const AdminLeave: React.FC = () => {
    const [leaveApplications, setLeaveApplications] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await leaveService.getAll();
            setLeaveApplications(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load leave applications');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!window.confirm('Approve this leave application?')) {
            return;
        }

        try {
            await leaveService.approve(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve leave');
        }
    };

    const handleReject = async (id: string) => {
        const comment = prompt('Enter rejection comment:');
        if (!comment) return;

        try {
            await leaveService.reject(id, comment);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject leave');
        }
    };

    const getStaffName = (staffId: string | Staff) => {
        if (typeof staffId === 'object') return staffId.fullName;
        return 'Staff Member';
    };

    const filteredLeave = leaveApplications.filter((leave) => {
        return statusFilter === 'all' || leave.status === statusFilter;
    });

    const pendingCount = leaveApplications.filter(l => l.status === 'Pending').length;

    if (loading) {
        return <div className="loading">Loading leave applications...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Leave Approval</h1>
                    <p className="text-muted">Review and approve leave applications</p>
                </div>
                {pendingCount > 0 && (
                    <div className="pending-badge">
                        <span className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            {pendingCount} Pending
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-alert mb-3">
                    {error}
                </div>
            )}

            <div className="card mb-3">
                <div className="entry-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                📋 List View
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                📅 Calendar View
                            </button>
                        </div>
                        {viewMode === 'list' && (
                            <select
                                className="select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                style={{ maxWidth: '200px' }}
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <LeaveCalendar leaves={leaveApplications.filter(l => l.status === 'Approved')} />
            ) : (
                <div className="card">
                    <div className="entry-count mb-3">
                        <strong>{filteredLeave.length}</strong> leave applications found
                    </div>

                    {filteredLeave.length === 0 ? (
                        <div className="empty-state">
                            <p>No leave applications to review</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staff</th>
                                        <th>Type</th>
                                        <th>Duration</th>
                                        <th>Total Days</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeave.map((leave) => (
                                        <tr key={leave._id}>
                                            <td>
                                                <div className="staff-name">{getStaffName(leave.staffId)}</div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${leave.leaveType === 'Paid' ? 'success' :
                                                    leave.leaveType === 'Sick' ? 'warning' :
                                                        leave.leaveType === 'Casual' ? 'primary' : 'secondary'
                                                    }`}>
                                                    {leave.leaveType}
                                                </span>
                                                {leave.isHalfDay && (
                                                    <div className="text-sm text-muted">Half Day</div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="entry-date">
                                                    {new Date(leave.startDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-muted text-sm">to</div>
                                                <div className="entry-date">
                                                    {new Date(leave.endDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="text-primary">
                                                <strong>{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}</strong>
                                            </td>
                                            <td>
                                                <div className="entry-description">{leave.reason}</div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${leave.status === 'Approved' ? 'success' :
                                                    leave.status === 'Rejected' ? 'danger' : 'warning'
                                                    }`}>
                                                    {leave.status}
                                                </span>
                                                {leave.status === 'Rejected' && leave.rejectionComment && (
                                                    <div className="text-sm text-danger mt-1">
                                                        {leave.rejectionComment}
                                                    </div>
                                                )}
                                                {leave.status === 'Approved' && leave.approvedAt && (
                                                    <div className="text-sm text-muted mt-1">
                                                        {new Date(leave.approvedAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {leave.status === 'Pending' && (
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => handleApprove(leave._id)}
                                                            className="btn btn-success btn-sm"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(leave._id)}
                                                            className="btn btn-danger btn-sm"
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                    }
                </div >
            )}
        </div>
    );
};
