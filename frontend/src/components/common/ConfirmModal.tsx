import React from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'warning' | 'danger' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'warning',
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return '⚠️';
            case 'danger':
                return '🚨';
            case 'info':
                return 'ℹ️';
            default:
                return '⚠️';
        }
    };

    return createPortal(
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className={`confirm-modal-header confirm-modal-${type}`}>
                    <span className="confirm-modal-icon">{getIcon()}</span>
                    <h3>{title}</h3>
                </div>
                <div className="confirm-modal-body">
                    <p>{message}</p>
                </div>
                <div className="confirm-modal-footer">
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
