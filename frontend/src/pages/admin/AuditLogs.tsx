import React, { useState, useEffect } from 'react';
import { auditLogService } from '../../services/settingsService';
import type { AuditLog } from '../../types';
import './AdminTimeEntry.css';

export const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const response = await auditLogService.getAll({
                action: filters.action || undefined,
                resource: filters.resource || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            });
            setLogs(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        });
    };

    const handleApplyFilters = () => {
        loadLogs();
    };

    const handleClearFilters = () => {
        setFilters({
            action: '',
            resource: '',
            startDate: '',
            endDate: '',
        });
        setTimeout(() => loadLogs(), 100);
    };

    if (loading) {
        return <div className="loading">Loading audit logs...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>Audit Logs</h1>
                    <p className="text-muted">View system activity and changes</p>
                </div>
            </div>

            {error && (
                <div className="error-alert mb-3">
                    {error}
                </div>
            )}

            <div className="card mb-3">
                <div className="form-grid" style={{ marginBottom: 'var(--spacing-md)' }}>
                    <div className="form-group">
                        <label htmlFor="action" className="form-label">
                            Action
                        </label>
                        <select
                            id="action"
                            name="action"
                            className="select"
                            value={filters.action}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="APPROVE">Approve</option>
                            <option value="REJECT">Reject</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="resource" className="form-label">
                            Resource
                        </label>
                        <select
                            id="resource"
                            name="resource"
                            className="select"
                            value={filters.resource}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Resources</option>
                            <option value="Staff">Staff</option>
                            <option value="TimeEntry">Time Entry</option>
                            <option value="Overtime">Overtime</option>
                            <option value="Leave">Leave</option>
                            <option value="Site">Site</option>
                            <option value="Payroll">Payroll</option>
                            <option value="Settings">Settings</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="startDate" className="form-label">
                            Start Date
                        </label>
                        <input
                            id="startDate"
                            name="startDate"
                            type="date"
                            className="input"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endDate" className="form-label">
                            End Date
                        </label>
                        <input
                            id="endDate"
                            name="endDate"
                            type="date"
                            className="input"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>

                <div className="action-buttons">
                    <button onClick={handleApplyFilters} className="btn btn-primary btn-sm">
                        Apply Filters
                    </button>
                    <button onClick={handleClearFilters} className="btn btn-secondary btn-sm">
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="entry-count mb-3">
                    <strong>{logs.length}</strong> audit log entries found
                </div>

                {logs.length === 0 ? (
                    <div className="empty-state">
                        <p>No audit logs found</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Resource</th>
                                    <th>Description</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log._id}>
                                        <td>
                                            <div className="text-sm">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="staff-name">
                                                {log.userId && typeof log.userId === 'object' ? (log.userId as any).email : 'System'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${log.action === 'CREATE' ? 'success' :
                                                log.action === 'UPDATE' ? 'primary' :
                                                    log.action === 'DELETE' ? 'danger' :
                                                        log.action === 'APPROVE' ? 'success' :
                                                            log.action === 'REJECT' ? 'danger' : 'secondary'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>{log.resource}</td>
                                        <td>
                                            <div className="entry-description">{log.description}</div>
                                        </td>
                                        <td className="text-muted text-sm">{log.ipAddress || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
