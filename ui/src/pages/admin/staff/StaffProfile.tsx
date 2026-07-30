import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { staffService } from '../../../services/staffService';
import { timeEntryService } from '../../../services/timeEntryService';
import { overtimeService } from '../../../services/overtimeService';
import { leaveService } from '../../../services/leaveService';
import type { Staff, TimeEntry, Overtime, Leave } from '../../../types';
import {
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Briefcase,
    DollarSign,
    FileText,
    Clock,
    Timer,
    Download
} from 'lucide-react';
import './StaffProfile.css';

export const StaffProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [staff, setStaff] = useState<Staff | null>(null);
    const [stats, setStats] = useState({
        totalHours: 0,
        otHours: 0,
        leaveTaken: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');

    useEffect(() => {
        if (id) {
            loadStaffData(id);
        }
    }, [id]);

    const loadStaffData = async (staffId: string) => {
        try {
            setLoading(true);
            const [staffRes, timeRes, otRes, leaveRes] = await Promise.all([
                staffService.getById(staffId),
                timeEntryService.getAll({} as any),
                overtimeService.getAll({} as any),
                leaveService.getAll({} as any)
            ]);

            setStaff(staffRes.data || null);

            // Calculate current month stats
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

            const monthTime = (timeRes.data || []).filter((e: TimeEntry) =>
                new Date(e.date).getTime() >= firstDay && e.status === 'Approved'
            );
            const monthOt = (otRes.data || []).filter((e: Overtime) =>
                new Date(e.date).getTime() >= firstDay && e.status === 'Approved'
            );
            const monthLeave = (leaveRes.data || []).filter((e: Leave) =>
                new Date(e.startDate).getTime() >= firstDay && e.status === 'Approved'
            );

            setStats({
                totalHours: monthTime.reduce((sum: number, e: TimeEntry) => sum + (e.totalHours || 0), 0),
                otHours: monthOt.reduce((sum: number, e: Overtime) => sum + (e.otHours || 0), 0),
                leaveTaken: monthLeave.reduce((sum: number, e: Leave) => sum + (e.totalDays || 0), 0)
            });

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load staff details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading staff profile...</div>;
    if (error) return <div className="error-alert">{error}</div>;
    if (!staff) return <div className="empty-state">Staff not found</div>;

    const getFileIcon = (filename: string) => {
        if (filename.endsWith('.pdf')) return '📋';
        if (filename.endsWith('.jpg') || filename.endsWith('.png')) return '🖼️';
        if (filename.endsWith('.doc') || filename.endsWith('.docx')) return '📝';
        return '📄';
    };

    return (
        <div className="staff-profile-page fade-in">
            {/* Header section with cover & basic info */}
            <div className="profile-header">
                <button className="back-btn" onClick={() => navigate('/admin/staff')}>
                    <ArrowLeft size={16} /> Back to Staff
                </button>

                <div className="profile-card-top card">
                    <div className="profile-hero">
                        <div className="profile-avatar">
                            {staff.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-title-area">
                            <h2>{staff.fullName}</h2>
                            <div className="profile-tags">
                                <span className={`badge badge-${staff.employmentStatus === 'Active' ? 'success' : 'secondary'}`}>
                                    {staff.employmentStatus}
                                </span>
                                {staff.role && <span className="badge role-badge">{staff.role}</span>}
                            </div>
                            <p className="designation">{staff.designation || 'Staff Member'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                >
                    Documents ({staff.documents?.length || 0})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        {/* Quick Stats */}
                        <div className="stat-cards-container">
                            <div className="stat-card blue">
                                <div className="icon-wrap"><Clock size={20} /></div>
                                <div className="stat-info">
                                    <span className="stat-val">{stats.totalHours.toFixed(1)}h</span>
                                    <span className="stat-label">Hours This Month</span>
                                </div>
                            </div>
                            <div className="stat-card amber">
                                <div className="icon-wrap"><Timer size={20} /></div>
                                <div className="stat-info">
                                    <span className="stat-val">{stats.otHours.toFixed(1)}h</span>
                                    <span className="stat-label">OT This Month</span>
                                </div>
                            </div>
                            <div className="stat-card green">
                                <div className="icon-wrap"><Calendar size={20} /></div>
                                <div className="stat-info">
                                    <span className="stat-val">{stats.leaveTaken}</span>
                                    <span className="stat-label">Leave Days Taken</span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information Grid */}
                        <div className="two-col-grid">
                            <div className="card info-card">
                                <h3>Contact Information</h3>
                                <div className="info-list">
                                    <div className="info-item">
                                        <Mail className="info-icon" />
                                        <div>
                                            <span className="info-label">Email</span>
                                            <span className="info-value">{staff.email}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Phone className="info-icon" />
                                        <div>
                                            <span className="info-label">Phone</span>
                                            <span className="info-value">{staff.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <MapPin className="info-icon" />
                                        <div>
                                            <span className="info-label">Address</span>
                                            <span className="info-value">{staff.address || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card info-card">
                                <h3>Employment Details</h3>
                                <div className="info-list">
                                    <div className="info-item">
                                        <Briefcase className="info-icon" />
                                        <div>
                                            <span className="info-label">Employee ID</span>
                                            <span className="info-value mono">{staff.employeeId || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Calendar className="info-icon" />
                                        <div>
                                            <span className="info-label">Join Date</span>
                                            <span className="info-value">
                                                {staff.startDate ? new Date(staff.startDate).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <DollarSign className="info-icon" />
                                        <div>
                                            <span className="info-label">Hourly Rate</span>
                                            <span className="info-value">${staff.hourlyRate?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="documents-tab card">
                        <div className="card-header-flex">
                            <h3>Uploaded Documents</h3>
                        </div>

                        {!staff.documents || staff.documents.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={48} className="text-muted mb-2" />
                                <p>No documents found for this staff member.</p>
                            </div>
                        ) : (
                            <div className="document-grid">
                                {staff.documents.map((doc, idx) => {
                                    const fileUrl = doc.path ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/${doc.path}` : '#';

                                    return (
                                        <div key={idx} className="document-card">
                                            <div className="doc-icon-area">
                                                {getFileIcon(doc.path || doc.name || '')}
                                            </div>
                                            <div className="doc-info">
                                                <div className="doc-name" title={doc.name}>{doc.name}</div>
                                                <div className="doc-meta">
                                                    Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="doc-actions">
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-icon"
                                                    title="View Document"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="history-tab card">
                        <h3>Status History</h3>
                        <div className="timeline">
                            <div className="timeline-item">
                                <div className="timeline-dot success"></div>
                                <div className="timeline-content">
                                    <div className="timeline-title">Account Created</div>
                                    <div className="timeline-date">{new Date(staff.createdAt || Date.now()).toLocaleDateString()}</div>
                                </div>
                            </div>
                            {/* Further history items could be mapped here if available in the model */}
                            <div className="empty-state-inline mt-4 text-muted text-sm text-center">
                                End of history
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
