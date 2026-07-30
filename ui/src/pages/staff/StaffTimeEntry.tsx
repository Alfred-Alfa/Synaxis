import React, { useState, useEffect } from 'react';
import { timeEntryService } from '../../services/timeEntryService';
import { siteService } from '../../services/siteService';
import type { TimeEntry, Site } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, AlertTriangle, Search, Trash2, ClipboardList, CheckCircle, Hourglass, Calendar, Inbox, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../components/ui/Pagination';
import './overtime-leave-v2.css';

export const StaffTimeEntry: React.FC = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeEntry, setActiveEntry] = useState<any>(null);
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
            
            // Check if user is currently checked in
            const statusRes = await timeEntryService.getCurrentStatus();
            setActiveEntry(statusRes.data);
            
            const [entriesRes, sitesRes] = await Promise.all([
                timeEntryService.getAll(isAdmin ? { mode: 'personal' } : {}),
                siteService.getAll({ status: 'Active' }),
            ]);
            setEntries(entriesRes.data || []);
            setSites(sitesRes.data || []);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
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

    const getSiteName = (siteId: string | Site | any) => {
        if (!siteId) return 'Unknown Site';
        if (typeof siteId === 'object') {
            return siteId.name || siteId.siteId?.name || 'Unknown Site';
        }
        const site = sites.find(s => s._id === siteId);
        return site?.name || 'Unknown Site';
    };

    // Filter entries
    const filteredEntries = entries.filter((entry) => {
        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
        const searchLower = searchQuery.toLowerCase();
        const siteName = getSiteName(entry.siteId).toLowerCase();
        const desc = (entry.jobDescription || '').toLowerCase();
        const matchesSearch = !searchLower || siteName.includes(searchLower) || desc.includes(searchLower);
        return matchesStatus && matchesSearch;
    });

    const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalCount = entries.length;
    const pendingCount = entries.filter(e => e.status === 'Pending').length;
    const approvedCount = entries.filter(e => e.status === 'Approved').length;
    const hoursLogged = entries
        .filter(e => {
            const d = new Date(e.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.status === 'Approved';
        })
        .reduce((sum, e) => sum + e.totalHours, 0)
        .toFixed(2);

    if (loading) {
        return <div className="loading">Loading time entries...</div>;
    }

    // If user is currently checked in, show warning and redirect
    if (activeEntry) {
        return (
            <div className="time-entry-page fade-in">
                <div className="card border-l-4 border-orange-500">
                    <div className="flex items-center p-6">
                        <AlertTriangle className="h-8 w-8 text-orange-500 mr-4 flex-shrink-0" />
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                Currently Checked In
                            </h2>
                            <p className="text-gray-600 mb-4">
                                You are currently checked in at <strong>{getSiteName(activeEntry.siteId)}</strong>. 
                                You cannot access time entries while on an active shift.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => navigate('/staff/dashboard')}
                                    className="btn btn-primary"
                                >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="btn btn-secondary"
                                >
                                    Refresh Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ol-page">
            <div className="ol-header">
                <div className="ph-left">
                    <h1>My Time Entries</h1>
                    <p>View your work hours logged via check-in / check-out</p>
                </div>
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
                    <div className="sc-label">Entries Submitted</div>
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
                    <div className="sc-label">Approved Entries</div>
                </div>
                <div className="stat-card-v2 sc-purple">
                    <div className="sc-top">
                        <div className="sc-icon-wrap"><Calendar size={20} /></div>
                        <span className="sc-period">This Month</span>
                    </div>
                    <div className="sc-val">{hoursLogged}</div>
                    <div className="sc-label">Hours Logged</div>
                </div>
            </div>

            <div className="table-card-v2">
                <div className="tc-head">
                    <div className="tc-title">
                        Time Entries
                        <span className="tc-count">{filteredEntries.length} found</span>
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
                                <th>Hours</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEntries.map((entry) => (
                                <tr key={entry._id}>
                                    <td>
                                        <div className="td-date-main">
                                            {new Date(entry.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        {entry.startTime && entry.endTime && (
                                            <span className="td-time">
                                                {entry.startTime} – {entry.endTime}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="td-site">
                                            <div className="site-dot" style={{ background: 'var(--blue-bar)' }}></div>
                                            {getSiteName(entry.siteId)}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="td-hrs">{entry.totalHours.toFixed(2)}</span>
                                    </td>
                                    <td>
                                        <div className="td-reason flex flex-col items-start gap-1" title={entry.jobDescription}>
                                            <span>{entry.jobDescription || '—'}</span>
                                            {entry.ownTransport && (
                                                <span className="inline-flex items-center text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                                    <Navigation size={10} className="mr-1 text-slate-400"/>
                                                    Own Transport: ${entry.travelDetails?.amount || 0}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-v2 ${entry.status === 'Approved' ? 'b-approved' : entry.status === 'Rejected' ? 'b-rejected' : 'b-pending'}`}>
                                            <span className="badge-dot"></span>
                                            {entry.status}
                                        </span>
                                        {entry.status === 'Rejected' && (entry.rejectionReason || entry.rejectionComment) && (
                                            <div className="text-[10px] text-red-500 mt-1 max-w-[140px] truncate" title={entry.rejectionReason || entry.rejectionComment}>
                                                {entry.rejectionReason || entry.rejectionComment}
                                            </div>
                                        )}
                                        {entry.status === 'Approved' && entry.approvalComment && (
                                            <div className="text-[10px] text-green-600 mt-1 max-w-[140px] truncate" title={entry.approvalComment}>
                                                {entry.approvalComment}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="act-row">
                                            <button
                                                className="act-btn act-del"
                                                onClick={() => handleDelete(entry._id, entry.status)}
                                                disabled={entry.status !== 'Pending'}
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredEntries.length === 0 && (
                        <div className="empty-state-v2">
                            <div className="empty-icon text-muted2"><Inbox size={40} strokeWidth={1.5} /></div>
                            <div className="empty-title">No results found</div>
                            <div className="empty-sub">
                                {entries.length === 0 
                                    ? "You haven't submitted any time entries yet." 
                                    : "Try adjusting your search or filters."}
                            </div>
                        </div>
                    )}
                </div>

                <div className="tc-footer">
                    <div className="tc-footer-txt"><b>{filteredEntries.length}</b> time entries</div>
                    {filteredEntries.length > 0 && (
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={filteredEntries.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            </div>

        </div>
    );
};
