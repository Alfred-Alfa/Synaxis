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
    const [documentType, setDocumentType] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const documentTypes = [
        'ID Card',
        'Passport',
        'Driver License',
        'Employment Contract',
        'Certificate/Degree',
        'Medical Certificate',
        'Police Clearance',
        'Bank Statement',
        'Other'
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file size (5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        if (!documentType) {
            setError('Please select a document type');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const docName = documentName || `${documentType} - ${new Date().toLocaleDateString()}`;
            await staffService.uploadDocument(staff._id, file, docName);
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
                    <h2>📄 Upload Document for {staff.fullName}</h2>
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
                            <label htmlFor="documentType" className="form-label">
                                Document Type *
                            </label>
                            <select
                                id="documentType"
                                className="select"
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                required
                            >
                                <option value="">Select document type</option>
                                {documentTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="documentName" className="form-label">
                                Document Name (Optional)
                            </label>
                            <input
                                id="documentName"
                                name="documentName"
                                type="text"
                                className="input"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                placeholder="e.g., National ID - Front, Contract 2024"
                            />
                            <small className="text-muted">
                                Leave blank to auto-generate based on type and date
                            </small>
                        </div>

                        <div className="form-group form-group-full">
                            <label htmlFor="document" className="form-label">
                                Document File *
                            </label>
                            <input
                                id="document"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileChange}
                                className="input"
                                required
                            />
                            <small className="text-muted">
                                Accepted: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
                            </small>
                            {file && (
                                <div className="mt-2" style={{
                                    padding: '0.5rem',
                                    background: 'var(--surface-secondary)',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                }}>
                                    📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </div>
                            )}
                        </div>

                        {staff.documents && staff.documents.length > 0 && (
                            <div className="form-group form-group-full">
                                <label className="form-label">Existing Documents ({staff.documents.length})</label>
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.375rem',
                                    padding: '0.5rem'
                                }}>
                                    {staff.documents.map((doc, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                padding: '0.625rem',
                                                marginBottom: '0.5rem',
                                                background: 'var(--surface-secondary)',
                                                borderRadius: '0.375rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 500 }}>📄 {doc.name}</div>
                                                <small className="text-muted">
                                                    Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                                </small>
                                            </div>
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
