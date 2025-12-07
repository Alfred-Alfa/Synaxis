import React, { useState, useEffect } from 'react';
import { timeEntryService } from '../../services/timeEntryService';
import { siteService } from '../../services/siteService';
import type { TimeEntry, Site, Staff } from '../../types';
import { ApprovalModal } from '../../components/common/ApprovalModal';
import './AdminTimeEntry.css';

export const AdminTimeEntry: React.FC = () => {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [entriesRes, sitesRes] = await Promise.all([
                timeEntryService.getAll(),
                siteService.getAll({ status: 'Active' }),
            ]);
            setEntries(entriesRes.data || []);
            setSites(sitesRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!window.confirm('Approve this time entry?')) {
            return;
        }

        try {
            await timeEntryService.approve(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve entry');
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        const comment = prompt('Additional comments (optional):');

        try {
            await timeEntryService.reject(id, reason, comment || undefined);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject entry');
        }
    };

    const getSiteName = (siteId: string | Site) => {
        if (typeof siteId === 'object') return siteId.name;
        const site = sites.find(s => s._id === siteId);
        return site?.name || 'Unknown Site';
    };

    const getStaffName = (staffId: string | Staff) => {
        if (typeof staffId === 'object') return staffId.fullName;
        return 'Staff Member';
    };

    // Filter entries
    const filteredEntries = entries.filter((entry) => {
        return statusFilter === 'all' || entry.status === statusFilter;
    });

    // Count pending entries
    const pendingCount = entries.filter(e => e.status === 'Pending').length;

    if (loading) {
        return <div className="loading">Loading time entries...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Time Entry Approval</h1>
                    <p className="text-muted">Review and approve staff time entries</p>
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
                <div className="entry-filters">
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
                </div>
            </div>

            <div className="card">
                <div className="entry-count mb-3">
                    <strong>{filteredEntries.length}</strong> time entries found
                </div>

                {filteredEntries.length === 0 ? (
                    <div className="empty-state">
                        <p>No time entries to review</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Staff</th>
                                    <th>Date</th>
                                    <th>Site/Project</th>
                                    <th>Hours</th>
                                    <th>Description</th>
                                    <th>Travel</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => (
                                    <tr key={entry._id}>
                                        <td>
                                            <div className="staff-name">{getStaffName(entry.staffId)}</div>
                                        </td>
                                        <td>
                                            <div className="entry-date">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </div>
                                            {entry.startTime && entry.endTime && (
                                                <div className="text-muted text-sm">
                                                    {entry.startTime} - {entry.endTime}
                                                </div>
                                            )}
                                        </td>
                                        <td>{getSiteName(entry.siteId)}</td>
                                        <td className="text-primary">
                                            <strong>{entry.totalHours.toFixed(2)} hrs</strong>
                                        </td>
                                        <td>
                                            <div className="entry-description">{entry.jobDescription}</div>
                                        </td>
                                        <td>
                                            {entry.ownTransport ? (
                                                <div className="text-sm">
                                                    🚗 ${entry.travelDetails?.amount || 0}
                                                    {entry.travelDetails?.distance && (
                                                        <div className="text-muted">{entry.travelDetails.distance}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${entry.status === 'Approved' ? 'success' :
                                                entry.status === 'Rejected' ? 'danger' : 'warning'
                                                }`}>
                                                {entry.status}
                                            </span>
                                            {entry.status === 'Rejected' && entry.rejectionReason && (
                                                <div className="text-sm text-danger mt-1">
                                                    {entry.rejectionReason}
                                                </div>
                                            )}
                                            {entry.status === 'Approved' && entry.approvedAt && (
                                                <div className="text-sm text-muted mt-1">
                                                    {new Date(entry.approvedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {entry.status === 'Pending' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => openApproveModal(entry._id)}
                                                        className="btn btn-success btn-sm"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(entry._id)}
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
                )}
            </div>

            <ApprovalModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onApprove={handleApprove}
                onReject={handleReject}
                type={modalConfig.type}
                title={modalConfig.title}
            />
        </div>
    );
};
