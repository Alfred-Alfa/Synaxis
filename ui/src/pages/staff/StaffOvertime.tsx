import React, { useState, useEffect } from 'react';
import { overtimeService } from '../../services/overtimeService';
import { siteService } from '../../services/siteService';
import type { Overtime, Site } from '../../types';
import { OvertimeFormModal } from '../../components/forms/OvertimeFormModal';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, ClipboardList, Clock, CheckCircle, Hourglass, Inbox } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import '../staff/overtime-leave-v2.css';

export const StaffOvertime: React.FC = () => {
    const { isAdmin } = useAuth();
    const [overtimeRequests, setOvertimeRequests] = useState<Overtime[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedOT, setSelectedOT] = useState<Overtime | null>(null);
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
            const [otRes, sitesRes] = await Promise.all([
                overtimeService.getAll(isAdmin ? { mode: 'personal' } : {}),
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
        const matchesStatus = statusFilter === 'all' || ot.status === statusFilter;
        const searchLower = searchQuery.toLowerCase();
        const siteName = getSiteName(ot.siteId).toLowerCase();
        const reason = (ot.reason || '').toLowerCase();
        const matchesSearch = !searchLower || siteName.includes(searchLower) || reason.includes(searchLower);
        return matchesStatus && matchesSearch;
    });

    const paginatedOT = filteredOT.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalCount = overtimeRequests.length;
    const pendingCount = overtimeRequests.filter(ot => ot.status === 'Pending').length;
    const approvedCount = overtimeRequests.filter(ot => ot.status === 'Approved').length;
    const otHoursLogged = overtimeRequests
        .filter(ot => {
            const d = new Date(ot.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && ot.status === 'Approved';
        })
        .reduce((sum, ot) => sum + ot.otHours, 0)
        .toFixed(2);

    if (loading) {
        return <div className="loading">Loading overtime requests...</div>;
    }

    return (
        <div className="ol-page">
            <div className="ol-header">
                <div className="ph-left">
                    <h1>My Overtime</h1>
                    <p>Submit and track your overtime requests</p>
                </div>
                <button onClick={handleAdd} className="btn-primary-v2">
                    <Plus size={16} strokeWidth={2.5} />
                    New OT Request
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
                    <div className="sc-label">Requests Submitted</div>
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
                    <div className="sc-label">Approved Requests</div>
                </div>
                <div className="stat-card-v2 sc-purple">
                    <div className="sc-top">
                        <div className="sc-icon-wrap"><Clock size={20} /></div>
                        <span className="sc-period">This Month</span>
                    </div>
                    <div className="sc-val">{otHoursLogged}</div>
                    <div className="sc-label">OT Hours Logged</div>
                </div>
            </div>

            <div className="table-card-v2">
                <div className="tc-head">
                    <div className="tc-title">
                        Overtime Requests
                        <span className="tc-count">{filteredOT.length} found</span>
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
                                <th>Date</th>
                                <th>Site / Project</th>
                                <th>OT Hours</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOT.map((ot) => (
                                <tr key={ot._id}>
                                    <td>
                                        <div className="td-date-main">
                                            {new Date(ot.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        {ot.startTime && ot.endTime && (
                                            <span className="td-time">
                                                {ot.startTime} – {ot.endTime}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="td-site">
                                            <div className="site-dot" style={{ background: 'var(--blue-bar)' }}></div>
                                            {getSiteName(ot.siteId)}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="td-hrs">{ot.otHours.toFixed(2)}</span>
                                    </td>
                                    <td>
                                        <div className="td-reason" title={ot.reason}>{ot.reason || '—'}</div>
                                    </td>
                                    <td>
                                        <span className={`badge-v2 ${ot.status === 'Approved' ? 'b-approved' : ot.status === 'Rejected' ? 'b-rejected' : 'b-pending'}`}>
                                            <span className="badge-dot"></span>
                                            {ot.status}
                                        </span>
                                        {ot.status === 'Rejected' && (ot.rejectionReason || ot.rejectionComment) && (
                                            <div className="text-[10px] text-red-500 mt-1 max-w-[140px] truncate" title={ot.rejectionReason || ot.rejectionComment}>
                                                {ot.rejectionReason || ot.rejectionComment}
                                            </div>
                                        )}
                                        {ot.status === 'Approved' && ot.approvalComment && (
                                            <div className="text-[10px] text-green-600 mt-1 max-w-[140px] truncate" title={ot.approvalComment}>
                                                {ot.approvalComment}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="act-row">
                                            <button
                                                className="act-btn act-edit"
                                                onClick={() => handleEdit(ot)}
                                                disabled={ot.status !== 'Pending'}
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button
                                                className="act-btn act-del"
                                                onClick={() => handleDelete(ot._id, ot.status)}
                                                disabled={ot.status !== 'Pending'}
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredOT.length === 0 && (
                        <div className="empty-state-v2">
                            <div className="empty-icon text-muted2"><Inbox size={40} strokeWidth={1.5} /></div>
                            <div className="empty-title">No results found</div>
                            <div className="empty-sub">
                                {overtimeRequests.length === 0
                                    ? "You haven't submitted any overtime requests yet."
                                    : "Try adjusting your search or filters."}
                            </div>
                        </div>
                    )}
                </div>

                <div className="tc-footer">
                    <div className="tc-footer-txt"><b>{filteredOT.length}</b> overtime requests</div>
                    {filteredOT.length > 0 && (
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={filteredOT.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
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
