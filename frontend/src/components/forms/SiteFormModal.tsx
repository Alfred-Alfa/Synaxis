import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { siteService } from '../../services/siteService';
import type { Site } from '../../types';
import {
    X,
    Building2,
    MapPin,
    User,
    Clock,
    Building
} from 'lucide-react';
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

    return createPortal(
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-container fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-content">
                        <div className="icon-badge">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2>{isEdit ? 'Edit Site' : 'New Site Project'}</h2>
                            <p className="subtitle">
                                {isEdit ? 'Update site details and configuration' : 'Add a new work site or project location'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => onClose()} className="close-button" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="error-banner">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-scroll-area">
                        {/* Project Details Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <Building size={18} />
                                Project Details
                            </h3>

                            <div className="input-group">
                                <label htmlFor="name">Site/Project Name <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <Building2 className="input-icon" size={18} />
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        className="input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Downtown Office Complex"
                                    />
                                </div>
                            </div>

                            <div className="form-grid"> {/* Using existing grid class from css file if available or grid-2 */}
                                <div className="input-group">
                                    <label htmlFor="client">Client Name</label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" size={18} />
                                        <input
                                            id="client"
                                            name="client"
                                            type="text"
                                            value={formData.client}
                                            onChange={handleChange}
                                            placeholder="e.g., ACME Corp"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="otRate">Site OT Multiplier</label>
                                    <div className="input-wrapper">
                                        <Clock className="input-icon" size={18} />
                                        <input
                                            id="otRate"
                                            name="otRate"
                                            type="number"
                                            step="0.1"
                                            min="1"
                                            value={formData.otRate}
                                            onChange={handleChange}
                                            placeholder="Default (1.5)"
                                        />
                                    </div>
                                    <p className="input-hint">Overrides global/staff OT rates if set</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <MapPin size={18} />
                                Location
                            </h3>
                            <div className="input-group">
                                <label htmlFor="location">Site Address</label>
                                <div className="input-wrapper">
                                    <MapPin className="input-icon" size={18} />
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g., 123 Main St, City, Country"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (isEdit ? 'Update Site' : 'Create Site')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
