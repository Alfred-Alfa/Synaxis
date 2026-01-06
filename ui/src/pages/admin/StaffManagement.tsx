import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import type { Staff } from '../../types';
import { StaffFormModal } from '../../components/forms/StaffFormModal';
import { DocumentUploadModal } from '../../components/forms/DocumentUploadModal';
import './StaffManagement.css';
import { settingsService } from '../../services/settingsService';
import { passwordService } from '../../services/passwordService';
import {
    RefreshCw,
    Plus,
    Search,
    Key,
    Pencil,
    FileText,
    Trash2,
    CheckCircle,
    User,
    Shield,
    Crown
} from 'lucide-react';

export const StaffManagement: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
    const [showModal, setShowModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [currencySymbol, setCurrencySymbol] = useState('$');

    useEffect(() => {
        loadStaff();
    }, []);

    const getCurrencySymbol = (currencyCode: string) => {
        const symbols: Record<string, string> = {
            USD: '$', GBP: '£', EUR: '€', INR: '₹', SGD: 'S$', AUD: 'A$', CAD: 'C$', AED: 'AED '
        };
        return symbols[currencyCode] || currencyCode;
    };

    const loadStaff = async () => {
        try {
            setLoading(true);
            const [response, settingsRes] = await Promise.all([
                staffService.getAll(),
                settingsService.get()
            ]);
            setStaff(response.data || []);
            if (settingsRes.data?.currency) {
                setCurrencySymbol(getCurrencySymbol(settingsRes.data.currency));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedStaff(null);
        setShowModal(true);
    };

    const handleEdit = (staffMember: Staff) => {
        setSelectedStaff(staffMember);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to deactivate this staff member?')) {
            return;
        }

        try {
            await staffService.delete(id);
            loadStaff();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to deactivate staff');
        }
    };

    const handleReactivate = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to reactivate ${name}?`)) {
            return;
        }

        try {
            await staffService.reactivate(id);
            loadStaff();
            alert('Staff reactivated successfully');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reactivate staff');
        }
    };

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        setSelectedStaff(null);
        if (success) {
            loadStaff();
        }
    };

    const handleUploadDocument = (staffMember: Staff) => {
        setSelectedStaff(staffMember);
        setShowDocumentModal(true);
    };

    const handleDocumentModalClose = (success?: boolean) => {
        setShowDocumentModal(false);
        setSelectedStaff(null);
        if (success) {
            loadStaff();
        }
    };

    const handleSyncUsers = async () => {
        if (!window.confirm('🔄 Sync Staff-User Accounts?\n\nThis will create User accounts for any staff members who don\'t have one. Continue?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await staffService.syncUsers();
            alert(`✅ Sync Complete!\n\nCreated: ${response.data.created} new users\nExisting: ${response.data.existing} users\nTotal: ${response.data.total} staff members`);
            loadStaff(); // Refresh to show updated roles
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to sync users');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (staffMember: Staff) => {
        if (!window.confirm(`Are you sure you want to reset the password for ${staffMember.fullName}?\n\nThis will generate a password reset link and email it to ${staffMember.email}.`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await passwordService.adminResetPassword(staffMember._id);
            alert(response.message || 'Password reset email sent successfully');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    // Filter staff
    const filteredStaff = staff.filter((s) => {
        const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || s.employmentStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div className="loading-state">Loading staff directory...</div>;
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header-row">
                <div>
                    <h1>Staff Management</h1>
                    <p className="text-muted">Manage employee information and system access</p>
                </div>
                <div className="page-actions">
                    <button
                        onClick={handleSyncUsers}
                        className="btn btn-secondary"
                        title="Sync Staff-User Accounts"
                    >
                        <RefreshCw size={16} />
                        Sync Users
                    </button>
                    <button onClick={handleAdd} className="btn btn-primary">
                        <Plus size={16} />
                        Add Staff
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            <div className="card filter-card mb-4">
                <div className="filter-row">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            className="input search-input"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="select status-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="card table-card">
                <div className="card-header-row">
                    <div className="record-count">
                        <strong>{filteredStaff.length}</strong> staff members found
                    </div>
                </div>

                {filteredStaff.length === 0 ? (
                    <div className="empty-state">
                        <User size={48} className="text-muted" />
                        <p>No staff members found.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Designation</th>
                                    <th>Hourly Rate</th>
                                    <th>Docs</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map((staffMember) => (
                                    <tr key={staffMember._id}>
                                        <td>
                                            <span className="mono-text">
                                                {staffMember.employeeId || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="staff-info-cell">
                                                <div className="staff-name-row">
                                                    {staffMember.fullName}
                                                    {staffMember.role && staffMember.role !== 'Staff' && (
                                                        <span
                                                            className={`role-badge ${staffMember.role === 'SuperAdmin' ? 'super-admin' : 'admin'}`}
                                                            title={staffMember.role}
                                                        >
                                                            {staffMember.role === 'SuperAdmin' ? <Crown size={12} /> : <Shield size={12} />}
                                                        </span>
                                                    )}
                                                </div>
                                                {staffMember.phone && (
                                                    <div className="text-muted text-xs">{staffMember.phone}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{staffMember.email}</td>
                                        <td>{staffMember.designation || '-'}</td>
                                        <td className="font-medium">
                                            {currencySymbol}{staffMember.hourlyRate.toFixed(2)}/hr
                                        </td>
                                        <td>
                                            {staffMember.documents && staffMember.documents.length > 0 ? (
                                                <div className="doc-count">
                                                    <FileText size={14} />
                                                    {staffMember.documents.length}
                                                </div>
                                            ) : (
                                                <span className="text-muted text-center block">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${staffMember.employmentStatus === 'Active' ? 'success' : 'secondary'}`}>
                                                {staffMember.employmentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleResetPassword(staffMember)}
                                                    className="icon-btn"
                                                    title="Reset Password"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(staffMember)}
                                                    className="icon-btn"
                                                    title="Edit Details"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleUploadDocument(staffMember)}
                                                    className="icon-btn"
                                                    title="Manage Documents"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                {staffMember.employmentStatus === 'Active' ? (
                                                    <button
                                                        onClick={() => handleDelete(staffMember._id)}
                                                        className="icon-btn danger"
                                                        title="Deactivate"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivate(staffMember._id, staffMember.fullName)}
                                                        className="icon-btn success"
                                                        title="Reactivate"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
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
                <StaffFormModal
                    staff={selectedStaff}
                    existingEmployeeIds={staff.map(s => s.employeeId).filter(Boolean) as string[]}
                    onClose={handleModalClose}
                />
            )}

            {showDocumentModal && selectedStaff && (
                <DocumentUploadModal
                    staff={selectedStaff}
                    onClose={handleDocumentModalClose}
                />
            )}
        </div>
    );
};
