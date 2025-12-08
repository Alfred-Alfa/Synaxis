import React, { useState, useEffect } from 'react';
import { timeEntryService } from '../../services/timeEntryService';
import { siteService } from '../../services/siteService';
import type { TimeEntry, Site } from '../../types';
import { TimeEntryFormModal } from '../../components/forms/TimeEntryFormModal';
import { useAuth } from '../../contexts/AuthContext';
import './StaffTimeEntry.css';

export const StaffTimeEntry: React.FC = () => {
    const { isAdmin } = useAuth();
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [entriesRes, sitesRes] = await Promise.all([
                timeEntryService.getAll(isAdmin ? { mode: 'personal' } : {}),
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

    const handleAdd = () => {
        setSelectedEntry(null);
        setShowModal(true);
    };

    const handleEdit = (entry: TimeEntry) => {
        if (entry.status !== 'Pending') {
            alert('Only pending entries can be edited');
            return;
        }
        setSelectedEntry(entry);
        setShowModal(true);
    };

    const handleDelete = async (id: string, status: string) => {
        if (status !== 'Pending') {
            alert('Only pending entries can be deleted');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this time entry?')) {
            return;
        }

        try {
            await timeEntryService.delete(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete entry');
        }
    };

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        setSelectedEntry(null);
        if (success) {
            loadData();
        }
    };

    const getSiteName = (siteId: string | Site) => {
        if (typeof siteId === 'object') return siteId.name;
        const site = sites.find(s => s._id === siteId);
        return site?.name || 'Unknown Site';
    };

    // Filter entries
    const filteredEntries = entries.filter((entry) => {
        return statusFilter === 'all' || entry.status === statusFilter;
    });

    if (loading) {
        return <div className="loading">Loading time entries...</div>;
    }

    return (
        <div className="time-entry-page fade-in">
            <div className="page-header">
                <div>
                    <h1>My Time Entries</h1>
                    <p className="text-muted">Submit and track your work hours</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    + New Time Entry
                </button>
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
                        <p>No time entries found</p>
                        <button onClick={handleAdd} className="btn btn-primary mt-2">
                            Submit Your First Time Entry
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Site/Project</th>
                                    <th>Hours</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => (
                                    <tr key={entry._id}>
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
                                            {entry.ownTransport && (
                                                <div className="text-sm text-muted">
                                                    🚗 Own transport: ${entry.travelDetails?.amount || 0}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${entry.status === 'Approved' ? 'success' :
                                                entry.status === 'Rejected' ? 'danger' : 'warning'
                                                }`}>
                                                {entry.status}
                                            </span>
                                            {entry.status === 'Rejected' && (entry.rejectionReason || entry.rejectionComment) && (
                                                <div className="text-sm text-danger mt-1">
                                                    {entry.rejectionReason || entry.rejectionComment}
                                                </div>
                                            )}
                                            {entry.status === 'Approved' && entry.approvalComment && (
                                                <div className="text-sm text-success mt-1">
                                                    {entry.approvalComment}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {entry.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(entry)}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry._id, entry.status)}
                                                            className="btn btn-danger btn-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <TimeEntryFormModal
                    entry={selectedEntry}
                    sites={sites}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};
