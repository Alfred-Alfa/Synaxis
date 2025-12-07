import React, { useState } from 'react';
import { siteService } from '../../services/siteService';
import type { Site } from '../../types';
import './StaffFormModal.css';

interface SiteFormModalProps {
    site: Site | null;
    onClose: (success?: boolean) => void;
}

export const SiteFormModal: React.FC<SiteFormModalProps> = ({ site, onClose }) => {
    const isEdit = !!site;

    const [formData, setFormData] = useState({
        name: site?.name || '',
        location: site?.location || '',
        client: site?.client || '',
        otRate: site?.otRate?.toString() || '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = {
                name: formData.name,
                location: formData.location || undefined,
                client: formData.client || undefined,
                otRate: formData.otRate ? parseFloat(formData.otRate) : undefined,
            };

            if (isEdit) {
                await siteService.update(site._id, data);
            } else {
                await siteService.create(data);
            }

            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} site`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Site' : 'Add New Site'}</h2>
                    <button onClick={() => onClose()} className="modal-close">×</button>
                </div>

                {error && (
                    <div className="error-alert mb-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group form-group-full">
                            <label htmlFor="name" className="form-label">
                                Site/Project Name *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Downtown Office"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location" className="form-label">
                                Location
                            </label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                className="input"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., 123 Main St"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="client" className="form-label">
                                Client
                            </label>
                            <input
                                id="client"
                                name="client"
                                type="text"
                                className="input"
                                value={formData.client}
                                onChange={handleChange}
                                placeholder="e.g., ACME Corp"
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="otRate" className="form-label">
                                OT Rate Multiplier (Site-Specific)
                            </label>
                            <input
                                id="otRate"
                                name="otRate"
                                type="number"
                                step="0.1"
                                min="1"
                                className="input"
                                value={formData.otRate}
                                onChange={handleChange}
                                placeholder="Leave empty for default"
                            />
                            <small className="text-muted">
                                Site-specific OT rate (e.g., 1.5 for 1.5x). Leave empty to use global or staff-specific rate.
                            </small>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : isEdit ? 'Update Site' : 'Add Site'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
