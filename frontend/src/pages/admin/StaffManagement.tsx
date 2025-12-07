import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import type { Staff } from '../../types';
import { StaffFormModal } from '../../components/forms/StaffFormModal';
// import { DocumentUploadModal } from '../../components/forms/DocumentUploadModal';
import './StaffManagement.css';

export const StaffManagement: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
    const [showModal, setShowModal] = useState(false);
    // const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            setLoading(true);
            const response = await staffService.getAll();
            setStaff(response.data || []);
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

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        setSelectedStaff(null);
        if (success) {
            loadStaff();
        }
    };

    /*const handleUploadDocument = (staffMember: Staff) => {
        setSelectedStaff(staffMember);
        setShowDocumentModal(true);
    };*/

    /*const handleDocumentModalClose = (success?: boolean) => {
        setShowDocumentModal(false);
        setSelectedStaff(null);
        if (success) {
            loadStaff();
        }
    };*/

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
                <button onClick={handleAdd} className="btn btn-primary">
                    + Add Staff
                </button>
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
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Designation</th>
                                    <th>Hourly Rate</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map((staffMember) => (
                                    <tr key={staffMember._id}>
                                        <td>
                                            <div className="staff-name">{staffMember.fullName}</div>
                                            {staffMember.phone && (
                                                <div className="text-muted text-sm">{staffMember.phone}</div>
                                            )}
                                        </td>
                                        <td>{staffMember.email}</td>
                                        <td>{staffMember.designation || '-'}</td>
                                        <td className="text-primary">
                                            <strong>${staffMember.hourlyRate.toFixed(2)}/hr</strong>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${staffMember.employmentStatus === 'Active' ? 'success' : 'secondary'}`}>
                                                {staffMember.employmentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleEdit(staffMember)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Edit
                                                </button>
                                                {staffMember.employmentStatus === 'Active' && (
                                                    <button
                                                        onClick={() => handleDelete(staffMember._id)}
                                                        className="btn btn-danger btn-sm"
                                                    >
                                                        Deactivate
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
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};
