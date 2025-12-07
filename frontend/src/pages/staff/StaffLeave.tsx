import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import type { Leave } from '../../types';
import { LeaveFormModal } from '../../components/forms/LeaveFormModal';
import '../staff/StaffTimeEntry.css';

export const StaffLeave: React.FC = () => {
    const [leaveApplications, setLeaveApplications] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

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

    const handleAdd = () => {
        setSelectedLeave(null);
        setShowModal(true);
    };

    const handleEdit = (leave: Leave) => {
        if (leave.status !== 'Pending') {
            alert('Only pending leave applications can be edited');
            return;
        }
        setSelectedLeave(leave);
        setShowModal(true);
    };

    const handleDelete = async (id: string, status: string) => {
        if (status !== 'Pending') {
            alert('Only pending leave applications can be deleted');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this leave application?')) {
            return;
        }

        try {
            await leaveService.delete(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete leave application');
        }
    };

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        setSelectedLeave(null);
        if (success) {
            loadData();
        }
    };

    const filteredLeave = leaveApplications.filter((leave) => {
        return statusFilter === 'all' || leave.status === statusFilter;
    });

    if (loading) {
        return <div className="loading">Loading leave applications...</div>;
    }

    return (
        <div className="time-entry-page fade-in">
            <div className="page-header">
                <div>
                    <h1>My Leave</h1>
                    <p className="text-muted">Apply for and track your leave requests</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    + Apply for Leave
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
                    <strong>{filteredLeave.length}</strong> leave applications found
                </div>

                {filteredLeave.length === 0 ? (
                    <div className="empty-state">
                        <p>No leave applications found</p>
                        <button onClick={handleAdd} className="btn btn-primary mt-2">
                            Submit Your First Leave Application
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
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
                                            <span className={`badge badge-${leave.leaveType === 'Paid' ? 'success' :
                                                    leave.leaveType === 'Sick' ? 'warning' :
                                                        leave.leaveType === 'Casual' ? 'primary' : 'secondary'
                                                }`}>
                                                {leave.leaveType}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="entry-date">
                                                {new Date(leave.startDate).toLocaleDateString()}
                                                {' - '}
                                                {new Date(leave.endDate).toLocaleDateString()}
                                            </div>
                                            {leave.isHalfDay && (
                                                <div className="text-muted text-sm">Half Day</div>
                                            )}
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
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {leave.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(leave)}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(leave._id, leave.status)}
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
                <LeaveFormModal
                    leave={selectedLeave}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};
