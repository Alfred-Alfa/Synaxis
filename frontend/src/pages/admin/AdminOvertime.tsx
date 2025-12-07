import React, { useState, useEffect } from 'react';
import { overtimeService } from '../../services/overtimeService';
import { siteService } from '../../services/siteService';
import type { Overtime, Site, Staff } from '../../types';
import { ApprovalModal } from '../../components/common/ApprovalModal';
import './AdminTimeEntry.css';

export const AdminOvertime: React.FC = () => {
    const [overtimeRequests, setOvertimeRequests] = useState<Overtime[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        itemId: string;
        title: string;
    }>({
        isOpen: false,
        type: 'approve',
        itemId: '',
        title: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [otRes, sitesRes] = await Promise.all([
                overtimeService.getAll(),
                siteService.getAll({ status: 'Active' }),
            ]);
            setOvertimeRequests(otRes.data || []);
            setSites(sitesRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const openApproveModal = (id: string) => {
        setModalConfig({
            isOpen: true,
            type: 'approve',
            itemId: id,
            title: 'Approve Overtime Request',
        });
    };

    const openRejectModal = (id: string) => {
        setModalConfig({
            isOpen: true,
            type: 'reject',
            itemId: id,
            title: 'Reject Overtime Request',
        });
    };

    const handleApprove = async (comment?: string) => {
        try {
            await overtimeService.approve(modalConfig.itemId, comment);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve overtime');
        }
    };

    const handleReject = async (reason: string, comment?: string) => {
        try {
            await overtimeService.reject(modalConfig.itemId, reason, comment);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject overtime');
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

    const filteredOT = overtimeRequests.filter((ot) => {
        return statusFilter === 'all' || ot.status === statusFilter;
    });

    const pendingCount = overtimeRequests.filter(ot => ot.status === 'Pending').length;

    if (loading) {
        return <div className="loading">Loading overtime requests...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Overtime Approval</h1>
                    <p className="text-muted">Review and approve overtime requests</p>
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
                    <strong>{filteredOT.length}</strong> overtime requests found
                </div>

                {filteredOT.length === 0 ? (
                    <div className="empty-state">
                        <p>No overtime requests to review</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Staff</th>
                                    <th>Date</th>
                                    <th>Site/Project</th>
                                    <th>OT Hours</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOT.map((ot) => (
                                    <tr key={ot._id}>
                                        <td>
                                            <div className="staff-name">{getStaffName(ot.staffId)}</div>
                                        </td>
                                        <td>
                                            <div className="entry-date">
                                                {new Date(ot.date).toLocaleDateString()}
                                            </div>
                                            {ot.startTime && ot.endTime && (
                                                <div className="text-muted text-sm">
                                                    {ot.startTime} - {ot.endTime}
                                                </div>
                                            )}
                                        </td>
                                        <td>{getSiteName(ot.siteId)}</td>
                                        <td className="text-primary">
                                            <strong>{ot.otHours.toFixed(2)} hrs</strong>
                                        </td>
                                        <td>
                                            <div className="entry-description">{ot.reason}</div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${ot.status === 'Approved' ? 'success' :
                                                ot.status === 'Rejected' ? 'danger' : 'warning'
                                                }`}>
                                                {ot.status}
                                            </span>
                                            {ot.status === 'Rejected' && ot.rejectionReason && (
                                                <div className="text-sm text-danger mt-1">
                                                    {ot.rejectionReason}
                                                </div>
                                            )}
                                            {ot.status === 'Approved' && ot.approvedAt && (
                                                <div className="text-sm text-muted mt-1">
                                                    {new Date(ot.approvedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {ot.status === 'Pending' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => openApproveModal(ot._id)}
                                                        className="btn btn-success btn-sm"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(ot._id)}
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
