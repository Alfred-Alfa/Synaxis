import React, { useState } from 'react';
import './ApprovalModal.css';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (comment?: string) => Promise<void>;
    onReject: (reason: string, comment?: string) => Promise<void>;
    type: 'approve' | 'reject';
    title: string;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    isOpen,
    onClose,
    onApprove,
    onReject,
    type,
    title,
}) => {
    const [reason, setReason] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (type === 'approve') {
                await onApprove(comment);
            } else {
                await onReject(reason, comment);
            }
            onClose();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setLoading(false);
            setReason('');
            setComment('');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {type === 'reject' && (
                            <div className="form-group">
                                <label>Rejection Reason (Required)</label>
                                <textarea
                                    className="form-control"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="Please state the reason for rejection..."
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>{type === 'reject' ? 'Additional Comments (Optional)' : 'Approval Remarks (Optional)'}</label>
                            <textarea
                                className="form-control"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={2}
                                placeholder={type === 'reject' ? "Any additional context..." : "Good job! Approved."}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`btn ${type === 'approve' ? 'btn-success' : 'btn-danger'}`}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
