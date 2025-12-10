import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

interface ToastProps {
    isOpen: boolean;
    message: string;
    title?: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    isOpen,
    message,
    title,
    type = 'success',
    duration = 4000,
    onClose,
}) => {
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '✅';
        }
    };

    return createPortal(
        <div className="toast-container">
            <div className={`toast toast-${type}`}>
                <div className="toast-content">
                    <span className="toast-icon">{getIcon()}</span>
                    <div className="toast-text">
                        {title && <div className="toast-title">{title}</div>}
                        <div className="toast-message">{message}</div>
                    </div>
                </div>
                <button className="toast-close" onClick={onClose}>
                    ×
                </button>
            </div>
        </div>,
        document.body
    );
};
