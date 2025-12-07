import React, { useState } from 'react';
import { staffService } from '../../services/staffService';
import type { Staff } from '../../types';
import '../forms/StaffFormModal.css';

interface DocumentUploadModalProps {
    staff: Staff;
    onClose: (success?: boolean) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ staff, onClose }) => {
    const [documentName, setDocumentName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await staffService.uploadDocument(staff._id, file, documentName);
            onClose(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload document');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Upload Document for {staff.fullName}</h2>
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
                            <label htmlFor="documentName" className="form-label">
                                Document Name *
                            </label>
                            <input
                                id="documentName"
                                name="documentName"
                                type="text"
                                className="input"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                required
                                placeholder="e.g., ID Card, Contract, Certificate"
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="document" className="form-label">
                                Document File *
                            </label>
                            <input
                                id="document"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="input"
                                required
                            />
                            <small className="text-muted">Accepted formats: PDF, JPG, PNG (Max 5MB)</small>
                        </div>

                        {staff.documents && staff.documents.length > 0 && (
                            <div className="form-group form-group-full">
                                <label className="form-label">Existing Documents</label>
                                <div className="document-list">
                                    {staff.documents.map((doc, index) => (
                                        <div key={index} className="document-item">
                                            <span>📄 {doc.name}</span>
                                            <small className="text-muted">
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                            {loading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
