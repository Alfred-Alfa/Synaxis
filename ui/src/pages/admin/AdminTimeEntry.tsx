import React, { useState, useEffect } from 'react';
import { timeEntryService } from '../../services/timeEntryService';
import { siteService } from '../../services/siteService';
import { staffService } from '../../services/staffService';
import type { TimeEntry, Site, Staff } from '../../types';
import { ApprovalModal } from '../../components/common/ApprovalModal';
import { TimeEntryFormModal } from '../../components/forms/TimeEntryFormModal';
import { LocationMapModal } from '../../components/common/LocationMapModal';
import { Plus } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import './AdminTimeEntry.css';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getPhotoUrl = (rawPath: string | undefined | null) => {
    if (!rawPath) return '';
    if (rawPath.startsWith('http') || rawPath.startsWith('data:') || rawPath.startsWith('blob')) return rawPath;
    const filename = rawPath.replace(/\\/g, '/').split('/').pop();
    if (!filename) return '';
    return `${API_BASE_URL}/uploads/${filename}`;
};

export const AdminTimeEntry: React.FC = () => {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

    const [mapModalConfig, setMapModalConfig] = useState<{
        isOpen: boolean;
        coordinates: { latitude: number, longitude: number } | null | undefined;
    }>({ isOpen: false, coordinates: null });

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
    const [showAddModal, setShowAddModal] = useState(false);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [entriesRes, sitesRes, staffRes] = await Promise.all([
                timeEntryService.getAll(),
                siteService.getAll({ status: 'Active' }),
                staffService.getAll({ status: 'Active' }),
            ]);
            setEntries(entriesRes.data || []);
            setSites(sitesRes.data || []);
            setStaffList(staffRes.data || []);
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

    const getStaffPhoto = (staffId: string | Staff | null | undefined) => {
        if (!staffId || typeof staffId !== 'object') return null;
        return staffId.profilePhoto;
    };

    // Filter entries
    const filteredEntries = entries.filter((entry) => {
        return statusFilter === 'all' || entry.status === statusFilter;
    });

    const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    // Count pending entries
    const pendingCount = entries.filter(e => e.status === 'Pending').length;

    if (loading) {
        return <div className="loading">Loading time entries...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Time Entry Verification</h1>
                    <p className="text-muted">Review and approve staff hours</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {pendingCount > 0 && (
                        <div className="pending-badge">
                            <span className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                {pendingCount} Pending
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={16} /> Add Missing Entry
                    </button>
                </div>
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
                                    <th>Photo</th>
                                    <th>Staff Name</th>
                                    <th>Date</th>
                                    <th>Site/Project</th>
                                    <th>Duration</th>
                                    <th>Description</th>
                                    <th>Check-in Selfie</th>
                                    <th>Check-out Selfie</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEntries.map((entry) => (
                                    <tr key={entry._id}>
                                        <td>
                                            <div className="v-photo-wrap" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>
                                                {getStaffPhoto(entry.staffId) ? (
                                                    <img 
                                                        src={getPhotoUrl(getStaffPhoto(entry.staffId))} 
                                                        alt="Staff" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '50%', fontSize: '12px', color: '#64748b' }}>
                                                        N/A
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="staff-name" style={{ fontWeight: 600 }}>{getStaffName(entry.staffId)}</div>
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
                                        <td>
                                            {getSiteName(entry.siteId) === 'Unknown Site' && entry.checkInLocation ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span>Unknown Site</span>
                                                    <a 
                                                        href="#" 
                                                        onClick={(e) => { 
                                                            e.preventDefault(); 
                                                            setMapModalConfig({ isOpen: true, coordinates: entry.checkInLocation }); 
                                                        }}
                                                        style={{ 
                                                            color: '#3b82f6', 
                                                            textDecoration: 'underline', 
                                                            fontSize: '0.875rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        view site
                                                    </a>
                                                </div>
                                            ) : (
                                                getSiteName(entry.siteId)
                                            )}
                                        </td>
                                        <td className="text-primary">
                                            <strong>{entry.totalHours ? `${entry.totalHours.toFixed(2)} hrs` : 'Running...'}</strong>
                                        </td>
                                        <td>
                                            <div className="entry-description">
                                                {entry.jobDescription}
                                                {entry.ownTransport && (
                                                    <div className="text-xs text-muted mt-1">Travel: ${entry.travelDetails?.amount || 0}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="v-photo-cell">
                                                {entry.checkInPhoto ? (
                                                    <div className="v-photo-wrap lg" onClick={() => window.open(getPhotoUrl(entry.checkInPhoto), '_blank')}>
                                                        <img 
                                                            src={getPhotoUrl(entry.checkInPhoto)} 
                                                            alt="Check-in" 
                                                        />
                                                    </div>
                                                ) : <span className="text-muted text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="v-photo-cell">
                                                {entry.checkOutPhoto ? (
                                                    <div className="v-photo-wrap lg" onClick={() => window.open(getPhotoUrl(entry.checkOutPhoto), '_blank')}>
                                                        <img 
                                                            src={getPhotoUrl(entry.checkOutPhoto)} 
                                                            alt="Check-out" 
                                                        />
                                                    </div>
                                                ) : <span className="text-muted text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${entry.status === 'Approved' ? 'success' :
                                                entry.status === 'Rejected' ? 'danger' :
                                                    entry.status === 'Active' ? 'info' : 'warning'
                                                }`}>
                                                {entry.status}
                                            </span>
                                            {entry.status === 'Rejected' && entry.rejectionReason && (
                                                <div className="text-sm text-danger mt-1">
                                                    {entry.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {entry.status === 'Pending' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => setEditingEntry(entry)}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        Review
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
                {filteredEntries.length > 0 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredEntries.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
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

            {showAddModal && (
                <TimeEntryFormModal
                    entry={null}
                    sites={sites}
                    adminMode={true}
                    staffList={staffList.map(s => ({ _id: s._id, fullName: s.fullName }))}
                    onClose={(success) => {
                        setShowAddModal(false);
                        if (success) loadData();
                    }}
                />
            )}

            <LocationMapModal 
                isOpen={mapModalConfig.isOpen}
                coordinates={mapModalConfig.coordinates}
                onClose={() => setMapModalConfig({ isOpen: false, coordinates: null })}
            />
        </div>
    );
};
