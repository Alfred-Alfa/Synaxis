import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import type { Leave } from '../../types';
import { LeaveFormModal } from '../../components/forms/LeaveFormModal';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, ClipboardList, Calendar, CheckCircle, Hourglass, Inbox } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import '../staff/overtime-leave-v2.css';

export const StaffLeave: React.FC = () => {
    const { isAdmin } = useAuth();
    const [leaveApplications, setLeaveApplications] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchQuery]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await leaveService.getAll(isAdmin ? { mode: 'personal' } : {});
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
        const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
        const searchLower = searchQuery.toLowerCase();
        const reason = (leave.reason || '').toLowerCase();
        const matchesSearch = !searchLower || reason.includes(searchLower) || leave.leaveType.toLowerCase().includes(searchLower);
        return matchesStatus && matchesSearch;
    });

    const paginatedLeave = filteredLeave.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalCount = leaveApplications.length;
    const pendingCount = leaveApplications.filter(l => l.status === 'Pending').length;
    const approvedCount = leaveApplications.filter(l => l.status === 'Approved').length;
    const daysLogged = leaveApplications
        .filter(l => {
            const d = new Date(l.startDate);
            const now = new Date();
            return d.getFullYear() === now.getFullYear() && l.status === 'Approved';
        })
        .reduce((sum, l) => sum + l.totalDays, 0);

    if (loading) {
        return <div className="loading">Loading leave applications...</div>;
    }

    return (
        <div className="ol-page">
            <div className="ol-header">
                <div className="ph-left">
                    <h1>My Leave</h1>
                    <p>Apply for and track your leave requests</p>
                </div>
                <button onClick={handleAdd} className="btn-primary-v2">
                    <Plus size={16} strokeWidth={2.5} />
                    Apply for Leave
                </button>
            </div>

            {error && (
                <div className="error-alert mb-3 rounded-lg p-3 bg-red-50 text-red-600 border border-red-200">
                    {error}
                </div>
            )}

            <div className="stats-grid-v2">
                <div className="stat-card-v2 sc-blue">
                    <div className="sc-top">
                        <div className="sc-icon-wrap"><ClipboardList size={20} /></div>
                        <span className="sc-period">Total</span>
                    </div>
                    <div className="sc-val">{totalCount}</div>
                    <div className="sc-label">Applications Submitted</div>
                </div>
                <div className="stat-card-v2 sc-amber">
                    <div className="sc-top">
                        <div className="sc-icon-wrap"><Hourglass size={20} /></div>
                        <span className="sc-period">Pending</span>
                    </div>
                    <div className="sc-val">{pendingCount}</div>
                    <div className="sc-label">Awaiting Approval</div>
                </div>
                <div className="stat-card-v2 sc-green">
                    <div className="sc-top">
                        <div className="sc-icon-wrap"><CheckCircle size={20} /></div>
                        <span className="sc-period">Approved</span>
                    </div>
                    <div className="sc-val">{approvedCount}</div>
                    <div className="sc-label">Approved Leaves</div>
                </div>
                <div className="stat-card-v2 sc-purple">
                    <div className="sc-top">
                        <div className="sc-icon-wrap"><Calendar size={20} /></div>
                        <span className="sc-period">This Year</span>
                    </div>
                    <div className="sc-val">{daysLogged}</div>
                    <div className="sc-label">Days Logged</div>
                </div>
            </div>

            <div className="table-card-v2">
                <div className="tc-head">
                    <div className="tc-title">
                        Leave Applications
                        <span className="tc-count">{filteredLeave.length} found</span>
                    </div>
                    <div className="tc-controls">
                        <div className="search-wrap">
                            <Search className="search-icon-v2" size={14} />
                            <input
                                type="text"
                                placeholder="Search…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="filter-sel-v2"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="tc-table">
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
                            {paginatedLeave.map((leave) => (
                                <tr key={leave._id}>
                                    <td>
                                        <div className="td-site">
                                            <div className="site-dot" style={{
                                                background:
                                                    leave.leaveType === 'Paid' ? 'var(--green-bar)' :
                                                        leave.leaveType === 'Sick' ? 'var(--amber-bar)' :
                                                            leave.leaveType === 'Casual' ? 'var(--blue-bar)' : 'var(--muted2)'
                                            }}></div>
                                            {leave.leaveType}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="td-date-main">
                                            {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                            {' - '}
                                            {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        {leave.isHalfDay && (
                                            <span className="td-time">Half Day</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="td-hrs">{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}</span>
                                    </td>
                                    <td>
                                        <div className="td-reason" title={leave.reason}>{leave.reason || '—'}</div>
                                    </td>
                                    <td>
                                        <span className={`badge-v2 ${leave.status === 'Approved' ? 'b-approved' : leave.status === 'Rejected' ? 'b-rejected' : 'b-pending'}`}>
                                            <span className="badge-dot"></span>
                                            {leave.status}
                                        </span>
                                        {leave.status === 'Rejected' && leave.rejectionComment && (
                                            <div className="text-[10px] text-red-500 mt-1 max-w-[140px] truncate" title={leave.rejectionComment}>
                                                {leave.rejectionComment}
                                            </div>
                                        )}
                                        {leave.status === 'Approved' && leave.approvalComment && (
                                            <div className="text-[10px] text-green-600 mt-1 max-w-[140px] truncate" title={leave.approvalComment}>
                                                {leave.approvalComment}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="act-row">
                                            <button
                                                className="act-btn act-edit"
                                                onClick={() => handleEdit(leave)}
                                                disabled={leave.status !== 'Pending'}
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button
                                                className="act-btn act-del"
                                                onClick={() => handleDelete(leave._id, leave.status)}
                                                disabled={leave.status !== 'Pending'}
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredLeave.length === 0 && (
                        <div className="empty-state-v2">
                            <div className="empty-icon text-muted2"><Inbox size={40} strokeWidth={1.5} /></div>
                            <div className="empty-title">No results found</div>
                            <div className="empty-sub">
                                {leaveApplications.length === 0
                                    ? "You haven't submitted any leave applications yet."
                                    : "Try adjusting your search or filters."}
                            </div>
                        </div>
                    )}
                </div>

                <div className="tc-footer">
                    <div className="tc-footer-txt"><b>{filteredLeave.length}</b> leave applications</div>
                    {filteredLeave.length > 0 && (
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={filteredLeave.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
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
