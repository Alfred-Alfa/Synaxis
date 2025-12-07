import React, { useState, useEffect } from 'react';
import { siteService } from '../../services/siteService';
import type { Site } from '../../types';
import { SiteFormModal } from '../../components/forms/SiteFormModal';
import './StaffManagement.css';

export const SiteManagement: React.FC = () => {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);

    useEffect(() => {
        loadSites();
    }, []);

    const loadSites = async () => {
        try {
            setLoading(true);
            const response = await siteService.getAll();
            setSites(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load sites');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedSite(null);
        setShowModal(true);
    };

    const handleEdit = (site: Site) => {
        setSelectedSite(site);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to deactivate this site?')) {
            return;
        }

        try {
            await siteService.delete(id);
            loadSites();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to deactivate site');
        }
    };

    const handleModalClose = (success?: boolean) => {
        setShowModal(false);
        setSelectedSite(null);
        if (success) {
            loadSites();
        }
    };

    const filteredSites = sites.filter((s) => {
        return statusFilter === 'all' || s.status === statusFilter;
    });

    if (loading) {
        return <div className="loading">Loading sites...</div>;
    }

    return (
        <div className="staff-management fade-in">
            <div className="page-header">
                <div>
                    <h1>Sites & Projects</h1>
                    <p className="text-muted">Manage work locations and projects</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    + Add Site
                </button>
            </div>

            {error && (
                <div className="error-alert mb-3">
                    {error}
                </div>
            )}

            <div className="card mb-3">
                <div className="staff-filters">
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
                    <strong>{filteredSites.length}</strong> sites found
                </div>

                {filteredSites.length === 0 ? (
                    <div className="empty-state">
                        <p>No sites found</p>
                        <button onClick={handleAdd} className="btn btn-primary mt-2">
                            Add First Site
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Site Name</th>
                                    <th>Location</th>
                                    <th>Client</th>
                                    <th>OT Rate</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSites.map((site) => (
                                    <tr key={site._id}>
                                        <td>
                                            <div className="staff-name">{site.name}</div>
                                        </td>
                                        <td>{site.location || '-'}</td>
                                        <td>{site.client || '-'}</td>
                                        <td>
                                            {site.otRate ? (
                                                <span className="text-primary">{site.otRate}x</span>
                                            ) : (
                                                <span className="text-muted">Default</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${site.status === 'Active' ? 'success' : 'secondary'}`}>
                                                {site.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleEdit(site)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Edit
                                                </button>
                                                {site.status === 'Active' && (
                                                    <button
                                                        onClick={() => handleDelete(site._id)}
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
                <SiteFormModal
                    site={selectedSite}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};
