import React, { useState, useEffect } from 'react';
import { overtimeService } from '../../services/overtimeService';
import { siteService } from '../../services/siteService';
import type { Overtime, Site } from '../../types';
import { OvertimeFormModal } from '../../components/forms/OvertimeFormModal';
import '../staff/StaffTimeEntry.css';

export const StaffOvertime: React.FC = () => {
    const [overtimeRequests, setOvertimeRequests] = useState<Overtime[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedOT, setSelectedOT] = useState<Overtime | null>(null);

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

    const handleAdd = () => {
        setSelectedOT(null);
        setShowModal(true);
    };

    const handleEdit = (ot: Overtime) => {
        if (ot.status !== 'Pending') {
            alert('Only pending overtime requests can be edited');
            return;
        }
        setSelectedOT(ot);
        setShowModal(true);
    };

    const handleDelete = async (id: string, status: string) => {
        if (status !== 'Pending') {
            alert('Only pending overtime requests can be deleted');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this overtime request?')) {
            return;
        }

        try {
            await overtimeService.delete(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete overtime request');
        }
    };

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        setSelectedOT(null);
        if (success) {
            loadData();
        }
    };

    const getSiteName = (siteId: string | Site) => {
        if (typeof siteId === 'object') return siteId.name;
        const site = sites.find(s => s._id === siteId);
        return site?.name || 'Unknown Site';
    };

    const filteredOT = overtimeRequests.filter((ot) => {
        return statusFilter === 'all' || ot.status === statusFilter;
    });

    if (loading) {
        return <div className="loading">Loading overtime requests...</div>;
    }

    return (
        <div className="time-entry-page fade-in">
            <div className="page-header">
                <div>
                    <h1>My Overtime</h1>
                    <p className="text-muted">Submit and track overtime requests</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    + New OT Request
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
                    <strong>{filteredOT.length}</strong> overtime requests found
                </div>

                {filteredOT.length === 0 ? (
                    <div className="empty-state">
                        <p>No overtime requests found</p>
                        <button onClick={handleAdd} className="btn btn-primary mt-2">
                            Submit Your First OT Request
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
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
                                            {ot.status === 'Rejected' && (ot.rejectionReason || ot.rejectionComment) && (
                                                <div className="text-sm text-danger mt-1">
                                                    {ot.rejectionReason || ot.rejectionComment}
                                                </div>
                                            )}
                                            {ot.status === 'Approved' && ot.approvalComment && (
                                                <div className="text-sm text-success mt-1">
                                                    {ot.approvalComment}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {ot.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(ot)}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(ot._id, ot.status)}
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
                <OvertimeFormModal
                    overtime={selectedOT}
                    sites={sites}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};
