import React, { useState } from 'react';
import './LocationRequiredWarning.css';

interface LocationRequiredWarningProps {
    onRequestPermission: () => void;
    onRetry: () => void;
    onDismiss?: () => void;
    error?: string;
}

export const LocationRequiredWarning: React.FC<LocationRequiredWarningProps> = ({
    onRequestPermission,
    onRetry,
    onDismiss,
    error
}) => {
    const [isRetrying, setIsRetrying] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const handleRetry = () => {
        setIsRetrying(true);
        onRetry();
        setTimeout(() => {
            setIsRetrying(false);
        }, 3000);
    };

    const handleOk = () => {
        setIsHiding(true);
        setTimeout(() => {
            if (onDismiss) onDismiss();
        }, 220);
    };

    const handlePermission = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    setPermissionGranted(true);
                    onRequestPermission();
                },
                () => {
                    onRequestPermission();
                }
            );
        } else {
            onRequestPermission();
        }
    };

    return (
        <div className="loc-warn-container">
            <div className="loc-warn-bg"></div>
            <div className="loc-warn-blob loc-warn-b1"></div>
            <div className="loc-warn-blob loc-warn-b2"></div>
            <div className="loc-warn-blob loc-warn-b3"></div>
            <div className="loc-warn-blob loc-warn-b4"></div>
            <div className="loc-warn-grid"></div>

            <div className={`loc-warn-card-wrap ${isHiding ? 'hiding' : ''}`}>
                <div className="loc-warn-card">
                    <div className="loc-warn-card-bar"></div>

                    <div className="loc-warn-card-body">
                        {/* Logo */}
                        <div className="loc-warn-card-logo">
                            <img src="/assets/static/synaxislogo.png" alt="Synaxis" style={{ height: "40px", objectFit: "contain" }} />
                        </div>

                        {/* Warning icon */}
                        <div className="loc-warn-ring">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" />
                                <line x1="12" y1="9" x2="12" y2="13" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="12" cy="17" r="1" fill="#dc2626" />
                            </svg>
                        </div>

                        {/* Status chip */}
                        <div className="loc-warn-status-chip">
                            <div className="loc-warn-chip-dot"></div>
                            Location Blocked
                        </div>

                        <h2>Location Required</h2>
                        <p className="loc-warn-subtitle">
                            {error || "Location services must be enabled to check in. Your position is needed to verify you're at the worksite."}
                        </p>

                        {/* Help box */}
                        <div className="loc-warn-help-box">
                            <div className="loc-warn-help-label">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                Still Having Issues?
                            </div>
                            <div className="loc-warn-help-items">
                                <div className="loc-warn-help-item">
                                    <div className="loc-warn-help-num">1</div>
                                    <div>Go to <strong>Device Settings</strong> and enable Location Services</div>
                                </div>
                                <div className="loc-warn-help-item">
                                    <div className="loc-warn-help-num">2</div>
                                    <div>Allow location access for your <strong>browser app</strong> in settings</div>
                                </div>
                                <div className="loc-warn-help-item">
                                    <div className="loc-warn-help-num">3</div>
                                    <div>Make sure you are accessing this page over <strong>HTTPS</strong></div>
                                </div>
                            </div>
                        </div>

                        <div className="loc-warn-divider"></div>

                        <div className="loc-warn-btn-row">
                            <button className="loc-warn-btn loc-warn-btn-ok" onClick={handleOk}>✕ Dismiss</button>
                            <button className="loc-warn-btn loc-warn-btn-retry" onClick={handleRetry}>
                                <div className="loc-warn-shimmer"></div>
                                <span>↻ Retry Location Check</span>
                            </button>
                        </div>

                        <div className="loc-warn-permission-link" onClick={handlePermission}>
                            🔓 Request Permission Again
                        </div>
                    </div>

                    <div className="loc-warn-card-footer">
                        🔒 Location data is used only to verify worksite attendance
                    </div>

                    {/* Retry / Success state */}
                    <div className={`loc-warn-retry-state ${(isRetrying || permissionGranted) ? 'show' : ''}`} id="retryState">
                        {permissionGranted ? (
                            <>
                                <div style={{ fontSize: '2rem' }}>✅</div>
                                <div className="loc-warn-retry-text" style={{ color: '#059669' }}>Location Granted!</div>
                                <div className="loc-warn-retry-sub">You can now check in</div>
                            </>
                        ) : (
                            <>
                                <div className="loc-warn-spinner"></div>
                                <div className="loc-warn-retry-text">Checking location…</div>
                                <div className="loc-warn-retry-sub">Please allow access if prompted</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
