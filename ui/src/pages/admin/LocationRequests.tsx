import React, { useState, useEffect } from 'react';
import { locationRequestService } from '../../services/locationRequestService';
import type { LocationRequest } from '../../types';
import { Toast } from '../../components/common/Toast';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { CheckCircle, XCircle, MapPin, Search, RefreshCw } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import './AdminTimeEntry.css'; // Reusing table styles

export const LocationRequests: React.FC = () => {
    const [requests, setRequests] = useState<LocationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' });
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, reqId: string, action: 'approve' | 'reject', rejectReason: string }>({
        show: false, reqId: '', action: 'approve', rejectReason: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const filteredRequests = requests.filter(req => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const staffName = typeof req.staffId === 'object' && 'fullName' in req.staffId ? req.staffId.fullName.toLowerCase() : '';
        return req.type.toLowerCase().includes(term) ||
            req.locationName.toLowerCase().includes(term) ||
            req.status.toLowerCase().includes(term) ||
            staffName.includes(term);
    });

    const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await locationRequestService.getAllAdmin();
            setRequests(res.data?.data || []);
            setError('');
        } catch (err: any) {
            setError('Failed to load location requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        try {
            if (confirmModal.action === 'approve') {
                await locationRequestService.approve(confirmModal.reqId);
                setToast({ show: true, title: 'Approved', message: 'Location request approved safely.', type: 'success' });
            } else {
                await locationRequestService.reject(confirmModal.reqId, confirmModal.rejectReason);
                setToast({ show: true, title: 'Rejected', message: 'Location request rejected.', type: 'success' });
            }
            loadRequests();
        } catch (err: any) {
            setToast({ show: true, title: 'Error', message: err.response?.data?.message || 'Action failed', type: 'error' });
        } finally {
            setConfirmModal({ ...confirmModal, show: false });
        }
    };

    if (loading) return <div className="loading">Loading requests...</div>;

    return (
        <div className="location-requests fade-in">
            <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1>Location Requests</h1>
                    <p className="text-muted">Manage staff home and remote location requests</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <button className="btn btn-secondary" onClick={loadRequests} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Coordinates</th>
                                <th>Status</th>
                                <th>Requested At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr><td colSpan={7} className="empty-state">No location requests found</td></tr>
                            ) : (
                                paginatedRequests.map(req => (
                                    <tr key={req._id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    {typeof req.staffId === 'object' && 'fullName' in req.staffId ? req.staffId.fullName.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <div className="user-name">{typeof req.staffId === 'object' && 'fullName' in req.staffId ? req.staffId.fullName : 'Unknown'}</div>
                                                    <div className="user-email">{typeof req.staffId === 'object' && 'email' in req.staffId ? req.staffId.email : ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{req.locationName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.description}</div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${req.type === 'Home' ? 'success' : 'info'}`}>
                                                {req.type}
                                            </span>
                                        </td>
                                        <td>
                                            <a
                                                href={`https://www.google.com/maps?q=${req.coordinates.latitude},${req.coordinates.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                                            >
                                                <MapPin size={14} /> Map View (Lat: {req.coordinates.latitude.toFixed(4)})
                                            </a>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Radius: {req.radius}m</div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {req.status === 'Pending' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => setConfirmModal({ show: true, reqId: req._id, action: 'approve', rejectReason: '' })}
                                                        className="btn-icon" title="Approve" style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '6px', borderRadius: '4px' }}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = window.prompt("Enter rejection reason:");
                                                            if (reason !== null) {
                                                                setConfirmModal({ show: true, reqId: req._id, action: 'reject', rejectReason: reason });
                                                            }
                                                        }}
                                                        className="btn-icon" title="Reject" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '4px', marginLeft: '8px' }}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredRequests.length > 0 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredRequests.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.show}
                title={confirmModal.action === 'approve' ? 'Approve Location Request' : 'Reject Location Request'}
                message={`Are you sure you want to ${confirmModal.action} this location request?`}
                confirmText={`Yes, ${confirmModal.action}`}
                cancelText="Cancel"
                type={confirmModal.action === 'approve' ? 'info' : 'danger'}
                onConfirm={handleAction}
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
            />

            <Toast
                isOpen={toast.show}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                duration={3000}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};
