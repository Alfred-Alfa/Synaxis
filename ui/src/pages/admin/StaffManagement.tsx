import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import type { Staff } from '../../types';
import { StaffFormModal } from '../../components/forms/StaffFormModal';
import { DocumentUploadModal } from '../../components/forms/DocumentUploadModal';
import './StaffManagement.css';
import { settingsService } from '../../services/settingsService';
import { passwordService } from '../../services/passwordService';

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
            console.log('Staff data from API:', response.data);
            response.data?.forEach((s: Staff) => {
                console.log(`${s.fullName}: role = ${s.role}`);
            });
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
        return <div className="loading">Loading staff...</div>;
    }

    return (
        <div className="staff-management fade-in">
            <div className="page-header">
                <div>
                    <h1>Staff Management</h1>
                    <p className="text-muted">Manage employee information and access</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleSyncUsers}
                        className="btn btn-secondary"
                        title="Sync Staff-User Accounts"
                    >
                        🔄 Sync Users
                    </button>
                    <button onClick={handleAdd} className="btn btn-primary">
                        + Add Staff
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-alert mb-3">
                    {error}
                </div>
            )}

            <div className="card mb-3">
                <div className="staff-filters">
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />

                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        style={{ maxWidth: '200px' }}
                    >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="staff-count mb-3">
                    <strong>{filteredStaff.length}</strong> staff members found
                </div>

                {filteredStaff.length === 0 ? (
                    <div className="empty-state">
                        <p>No staff members found</p>
                        <button onClick={handleAdd} className="btn btn-primary mt-2">
                            Add First Staff Member
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Designation</th>
                                    <th>Hourly Rate</th>
                                    <th>Documents</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map((staffMember) => (
                                    <tr key={staffMember._id}>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                                {staffMember.employeeId || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="staff-name">
                                                {staffMember.fullName}
                                                {staffMember.role && staffMember.role !== 'Staff' && (
                                                    <span
                                                        className={`role-badge role-badge-${staffMember.role.toLowerCase()}`}
                                                        title={`Role: ${staffMember.role}`}
                                                    >
                                                        {staffMember.role === 'SuperAdmin' ? '👑' : '🛡️'} {staffMember.role}
                                                    </span>
                                                )}
                                            </div>
                                            {staffMember.phone && (
                                                <div className="text-muted text-sm">{staffMember.phone}</div>
                                            )}
                                        </td>
                                        <td>{staffMember.email}</td>
                                        <td>{staffMember.designation || '-'}</td>
                                        <td className="text-primary">
                                            <strong>{currencySymbol}{staffMember.hourlyRate.toFixed(2)}/hr</strong>
                                        </td>
                                        <td>
                                            {staffMember.documents && staffMember.documents.length > 0 ? (
                                                <span className="badge badge-primary">
                                                    📄 {staffMember.documents.length}
                                                </span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${staffMember.employmentStatus === 'Active' ? 'success' : 'secondary'}`}>
                                                {staffMember.employmentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons" style={{ gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleResetPassword(staffMember)}
                                                    className="btn-icon"
                                                    title="Reset Password"
                                                >
                                                    🔑
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(staffMember)}
                                                    className="btn-icon"
                                                    title="Edit Staff"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleUploadDocument(staffMember)}
                                                    className="btn-icon"
                                                    title="Manage Documents"
                                                >
                                                    📄
                                                </button>
                                                {staffMember.employmentStatus === 'Active' ? (
                                                    <button
                                                        onClick={() => handleDelete(staffMember._id)}
                                                        className="btn-icon btn-icon-danger"
                                                        title="Deactivate Staff"
                                                    >
                                                        🗑️
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivate(staffMember._id, staffMember.fullName)}
                                                        className="btn-icon"
                                                        title="Reactivate Staff"
                                                        style={{ color: '#10b981' }}
                                                    >
                                                        ✅
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
