import React, { useState, useEffect } from 'react';
import { timeEntryService } from '../../services/timeEntryService';
import { siteService } from '../../services/siteService';
import type { TimeEntry, Site, Staff } from '../../types';
import { ApprovalModal } from '../../components/common/ApprovalModal';
import { TimeEntryFormModal } from '../../components/forms/TimeEntryFormModal';
import './AdminTimeEntry.css';
import {
    Clock,
    CheckCircle,
    XCircle,
    MapPin,
    Car,
    Calendar,
    Filter,
    FileText
} from 'lucide-react';

export const AdminTimeEntry: React.FC = () => {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        title: string;
        entityId: string;
    }>({
        isOpen: false,
        type: 'approve',
        title: '',
        entityId: '',
    });

    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

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

    const openApproveModal = (id: string) => {
        setModalConfig({
            isOpen: true,
            type: 'approve',
            title: 'Approve Time Entry',
            entityId: id,
        });
    };

    const openRejectModal = (id: string) => {
        setModalConfig({
            isOpen: true,
            type: 'reject',
            title: 'Reject Time Entry',
            entityId: id,
        });
    };

    const handleApprove = async (comment?: string) => {
        try {
            await timeEntryService.approve(modalConfig.entityId, comment);
            loadData();
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve entry');
        }
    };

    const handleReject = async (reason: string, comment?: string) => {
        try {
            await timeEntryService.reject(modalConfig.entityId, reason, comment);
            loadData();
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject entry');
        }
    };

    const getSiteName = (siteId: string | Site | null | undefined) => {
        if (!siteId) return 'Unknown Site';
        if (typeof siteId === 'object') return siteId.name || 'Unknown Site';
        const site = sites.find(s => s._id === siteId);
        return site?.name || 'Unknown Site';
    };

    const getStaffName = (staffId: string | Staff | null | undefined) => {
        if (!staffId) return 'Unknown Staff';
        if (typeof staffId === 'object') return staffId.fullName || 'Unknown Staff';
        return 'Staff Member';
    };

    // Filter entries
    const filteredEntries = entries.filter((entry) => {
        return statusFilter === 'all' || entry.status === statusFilter;
    });

    // Count pending entries
    const pendingCount = entries.filter(e => e.status === 'Pending').length;

    if (loading) {
        return <div className="loading-state">Loading time entries...</div>;
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header-row">
                <div>
                    <h1>Time Entries</h1>
                    <p className="text-muted">Review and approve staff hours</p>
                </div>
                {pendingCount > 0 && (
                    <div className="status-badge-large warning">
                        <Clock size={20} />
                        <span>{pendingCount} Pending</span>
                    </div>
                )}
            </div>

            {error && <div className="alert alert-error mb-4">{error}</div>}

            <div className="card filter-card mb-4">
                <div className="filter-row">
                    <div className="filter-group">
                        <Filter size={16} className="text-muted" />
                        <span className="text-sm font-medium">Filter Status:</span>
                        <select
                            className="select status-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">All Records</option>
                            <option value="Pending">Pending Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card table-card">
                <div className="card-header-row">
                    <div className="record-count">
                        <strong>{filteredEntries.length}</strong> records found
                    </div>
                </div>

                {filteredEntries.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={48} className="text-muted" />
                        <p>No time entries found matching filter.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Date & Time</th>
                                    <th>Site / Project</th>
                                    <th>Duration</th>
                                    <th>Description</th>
                                    <th>Travel</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => (
                                    <tr key={entry._id}>
                                        <td>
                                            <span className="font-medium text-primary">
                                                {getStaffName(entry.staffId)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} className="text-muted" />
                                                    {new Date(entry.date).toLocaleDateString()}
                                                </div>
                                                {entry.startTime && entry.endTime && (
                                                    <div className="text-xs text-muted ml-5">
                                                        {entry.startTime} - {entry.endTime}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-sm">
                                                <MapPin size={14} className="text-muted" />
                                                {getSiteName(entry.siteId)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-bold text-gray-800">
                                                {entry.totalHours ? `${entry.totalHours.toFixed(2)}h` : 'Running...'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="description-cell" title={entry.jobDescription}>
                                                {entry.jobDescription}
                                            </div>
                                        </td>
                                        <td>
                                            {entry.ownTransport ? (
                                                <div className="travel-pill">
                                                    <Car size={12} />
                                                    <span>${entry.travelDetails?.amount || 0}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${entry.status === 'Approved' ? 'success' :
                                                    entry.status === 'Rejected' ? 'danger' :
                                                        entry.status === 'Active' ? 'info' : 'warning'
                                                }`}>
                                                {entry.status === 'Approved' && <CheckCircle size={12} />}
                                                {entry.status === 'Rejected' && <XCircle size={12} />}
                                                {entry.status === 'Pending' && <Clock size={12} />}
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td>
                                            {entry.status === 'Pending' && (
                                                <button
                                                    onClick={() => setEditingEntry(entry)}
                                                    className="btn btn-primary btn-xs"
                                                >
                                                    Review
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editingEntry && (
                <TimeEntryFormModal
                    entry={editingEntry}
                    sites={sites}
                    onClose={(success) => {
                        setEditingEntry(null);
                        if (success) loadData();
                    }}
                    isAdminReview={true}
                    onApprove={() => {
                        const id = editingEntry._id;
                        setEditingEntry(null);
                        openApproveModal(id);
                    }}
                    onReject={() => {
                        const id = editingEntry._id;
                        setEditingEntry(null);
                        openRejectModal(id);
                    }}
                />
            )}

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
