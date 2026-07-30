import React, { useEffect, useState, useCallback } from 'react';

import { useGeofence } from '../../contexts/GeofenceContext';
import { GeofenceWarning } from '../../components/geofence/GeofenceWarning';
import { LocationOffWarning } from '../../components/geofence/LocationOffWarning';
import { LocationRequiredWarning } from '../../components/geofence/LocationRequiredWarning';
import { requestLocationPermission } from '../../utils/locationPermission';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { leaveService } from '../../services/leaveService';
import { siteService } from '../../services/siteService';
import { locationRequestService } from '../../services/locationRequestService';
import { getCurrentLocation } from '../../utils/geofence';
import type { Location as GeofenceLocation } from '../../utils/geofence';
import { AlertTriangle, MapPin, Camera, X } from 'lucide-react';
import { getDeviceId, getDeviceInfo } from '../../utils/deviceInfo';
import { CameraCapture } from '../../components/common/CameraCapture';
import './checkin-modal.css';
import './selfie-capture.css';

export const StaffDashboard: React.FC = () => {
    const {
        isWithinGeofence,
        isMonitoring,
        startMonitoring,
        stopMonitoring,
        warningShown,
        locationOffWarningShown
    } = useGeofence();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalHours: 0,
        otHours: 0,
        leaveTaken: 0,
        pendingRequests: 0,
    });

    // Check-in State
    const [activeEntry, setActiveEntry] = useState<any>(null);
    const [sites, setSites] = useState<any[]>([]);
    const [locationRequests, setLocationRequests] = useState<any[]>([]);
    const [homeLocation, setHomeLocation] = useState<any>(null);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [checkoutDesc, setCheckoutDesc] = useState('Standard Shift');

    // Location permission state
    const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
    const [showLocationRequiredWarning, setShowLocationRequiredWarning] = useState(true);
    const [locationError, setLocationError] = useState<string>('');
    const [showCheckInConfirm, setShowCheckInConfirm] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        loadDashboardData();
        loadCheckInData();
        checkLocationStatus();
    }, []);

    const checkLocationStatus = async () => {
        try {
            await getCurrentLocation();
            setLocationPermissionGranted(true);
            setLocationError('');
        } catch (error) {
            setLocationPermissionGranted(false);
            setLocationError('Ensure you have enabled location services. Location is required for check-in.');
        }
    };

    const loadCheckInData = async () => {
        try {
            const statusRes = await timeEntryService.getCurrentStatus();
            setActiveEntry(statusRes.data);

            const sitesRes = await siteService.getAll({ status: 'Active' });
            setSites(sitesRes.data || []);

            try {
                const locReqsRes = await locationRequestService.getMyLocations();
                const approvedLocs = (locReqsRes.data?.data?.requests || []).filter((r: any) => r.status === 'Approved');
                setLocationRequests(approvedLocs);
                setHomeLocation(locReqsRes.data?.data?.homeLocation || null);
            } catch (err) {
                console.error('Failed to load locations', err);
            }

            if (sitesRes.data && sitesRes.data.length > 0) {
                setSelectedLocation(`site_${sitesRes.data[0]._id}`);
            }
        } catch (err) {
            console.error('Failed to load check-in data', err);
        }
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            const [timeRes, otRes, leaveRes] = await Promise.all([
                timeEntryService.getAll({ startDate: firstDayOfMonth, endDate: lastDayOfMonth }),
                overtimeService.getAll({ startDate: firstDayOfMonth, endDate: lastDayOfMonth }),
                leaveService.getAll()
            ]);

            const timeEntries = timeRes.data || [];
            const overtimeEntries = otRes.data || [];
            const leaveEntries = leaveRes.data || [];

            const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.status === 'Approved' ? entry.totalHours : 0), 0);
            const otHours = overtimeEntries.reduce((sum, entry) => sum + (entry.status === 'Approved' ? entry.otHours : 0), 0);

            const [allPendingTime, allPendingOt, allPendingLeave] = await Promise.all([
                timeEntryService.getAll({ status: 'Pending' }),
                overtimeService.getAll({ status: 'Pending' }),
                leaveService.getAll({ status: 'Pending' })
            ]);

            const pendingCount = (allPendingTime.data?.length || 0) +
                (allPendingOt.data?.length || 0) +
                (allPendingLeave.data?.length || 0);

            const currentMonthLeave = leaveEntries.filter(leave => {
                const leaveDate = new Date(leave.startDate);
                return leaveDate >= new Date(firstDayOfMonth) && leaveDate <= new Date(lastDayOfMonth) && leave.status === 'Approved';
            });
            const leaveTaken = currentMonthLeave.reduce((sum, leave) => sum + leave.totalDays, 0);

            setStats({
                totalHours,
                otHours,
                leaveTaken,
                pendingRequests: pendingCount
            });

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckInAttempt = () => {
        if (!selectedLocation) return;
        setShowLocationRequiredWarning(true);
        setShowCheckInConfirm(true);
    };

    const handleCheckIn = async (forceWithoutLocation = false) => {
        setShowCheckInConfirm(false);
        if (!selectedLocation) return;

        const [locType, locId] = selectedLocation.split('_');
        let mode = locType;
        let pId = locId;

        if (locType === 'home') mode = 'home';
        if (locType === 'request') { mode = 'request'; pId = locId; }
        if (locType === 'site') { mode = 'site'; pId = locId; }

        setCheckInLoading(true);
        let locationResult: GeofenceLocation | null = null;

        if (!forceWithoutLocation) {
            try {
                locationResult = await getCurrentLocation();
                if (!locationPermissionGranted) {
                    setLocationPermissionGranted(true);
                    setLocationError('');
                }
            } catch (locationErr: any) {
                console.error('Location check failed:', locationErr);
                setLocationError(locationErr.message || 'Could not access location.');
                setLocationPermissionGranted(false);
                setCheckInLoading(false);
                setShowCheckInConfirm(true);
                return;
            }
        }

        if (!capturedPhoto) {
            alert('Please take a selfie to verify your identity.');
            setCheckInLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('locationMode', mode);
            if (mode === 'site' && pId) formData.append('siteId', pId);
            if (mode === 'request' && pId) formData.append('locationRequestId', pId);
            
            if (locationResult) {
                formData.append('latitude', locationResult.latitude.toString());
                formData.append('longitude', locationResult.longitude.toString());
            }

            if (capturedPhoto) {
                formData.append('photo', capturedPhoto);
            }

            formData.append('deviceId', getDeviceId());
            formData.append('deviceName', getDeviceInfo());

            const res = await timeEntryService.checkIn(formData);
            setActiveEntry(res.data);
            setLocationError('');
            setCapturedPhoto(null);
            setPhotoPreview(null);

            // Start geofencing monitoring
            let targetCoords: any = null;
            let targetRadius = 150;

            if (mode === 'home' && homeLocation?.coordinates) {
                targetCoords = homeLocation.coordinates;
                targetRadius = homeLocation.radius || 150;
            } else if (mode === 'request') {
                const req = locationRequests.find((r: any) => r._id === pId);
                if (req?.coordinates) {
                    targetCoords = req.coordinates;
                    targetRadius = req.radius || 150;
                }
            } else if (mode === 'site') {
                const site = sites.find(s => s._id === pId);
                if (site?.coordinates) {
                    targetCoords = site.coordinates;
                    targetRadius = site.radius || 50;
                }
            }

            if (locationResult && targetCoords?.latitude && targetCoords?.longitude) {
                startMonitoring({
                    center: {
                        latitude: targetCoords.latitude,
                        longitude: targetCoords.longitude
                    },
                    radius: targetRadius
                }, handleCheckOut);
            }

        } catch (err) {
            console.error('Check in failed:', err);
            setCheckInLoading(false);
            setLocationError('Check-in failed. Please try again.');
            setShowCheckInConfirm(true);
        } finally {
            setCheckInLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setCheckInLoading(true);
        try {
            const location = await getCurrentLocation();

            if (!capturedPhoto) {
                setShowCheckInConfirm(true);
                setCheckInLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('jobDescription', checkoutDesc);
            formData.append('latitude', location.latitude.toString());
            formData.append('longitude', location.longitude.toString());
            
            if (capturedPhoto) {
                formData.append('photo', capturedPhoto);
            }

            await timeEntryService.checkOut(formData);
            setActiveEntry(null);
            setCheckoutDesc('Standard Shift');
            setCapturedPhoto(null);
            setPhotoPreview(null);
            setShowCheckInConfirm(false);

            stopMonitoring();
            loadDashboardData();
            alert('Checked out successfully!');
        } catch (err) {
            console.error('Check out failed', err);
            alert('Failed to check out: ' + (err as Error).message);
        } finally {
            setCheckInLoading(false);
        }
    };

    const handleLocationPermissionRequest = async () => {
        try {
            const permission = await requestLocationPermission();
            setLocationPermissionGranted(permission.granted);
            if (permission.error) {
                setLocationError(permission.error);
            } else {
                setLocationError('');
            }
        } catch (error) {
            setLocationPermissionGranted(false);
            setLocationError('Failed to request location permission');
        }
    };

    const handleRetryLocationCheck = async () => {
        await checkLocationStatus();
    };

    const getActiveSiteName = () => {
        if (!activeEntry) return 'No Active Site';
        if (activeEntry.locationMode === 'home') return homeLocation?.label || 'Home Location';
        if (activeEntry.locationMode === 'request' && activeEntry.locationRequestId?.locationName) return activeEntry.locationRequestId.locationName;
        if (activeEntry.siteId && activeEntry.siteId.name) return activeEntry.siteId.name;
        return 'Unknown Site';
    };

    const handleCapture = useCallback((file: File) => {
        setCapturedPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        setShowCamera(false);
    }, []);

    const handleCameraClose = useCallback(() => {
        setShowCamera(false);
    }, []);

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    const currentDayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    return (
        <div className="fade-in" style={{ paddingBottom: '2rem' }}>
            {/* Geofence Check Information */}
            {isMonitoring && (
                <div style={{ background: isWithinGeofence ? 'var(--green-light)' : 'var(--red-light)', borderLeft: `4px solid ${isWithinGeofence ? 'var(--green)' : 'var(--red)'}`, padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MapPin color={isWithinGeofence ? 'var(--green)' : 'var(--red)'} size={20} />
                    <span style={{ fontWeight: 600, color: isWithinGeofence ? '#047857' : '#b91c1c' }}>
                        {isWithinGeofence ? 'Within Geofence Area' : 'Outside Geofence Area'}
                    </span>
                    {!isWithinGeofence && (
                        <AlertTriangle color="var(--red)" size={20} style={{ animation: 'blink 1.5s infinite' }} />
                    )}
                </div>
            )}

            {warningShown && <GeofenceWarning siteName={getActiveSiteName()} />}
            {locationOffWarningShown && <LocationOffWarning siteName={getActiveSiteName()} />}
            {locationPermissionGranted === false && showLocationRequiredWarning && !showCheckInConfirm && (
                <LocationRequiredWarning
                    onRequestPermission={handleLocationPermissionRequest}
                    onRetry={handleRetryLocationCheck}
                    onDismiss={() => setShowLocationRequiredWarning(false)}
                    error={locationError}
                />
            )}

            {/* SESSION BANNER */}
            <div className="session-banner">
                <div className="live-badge">
                    <div className="live-dot" style={{ background: activeEntry ? '#4ade80' : '#f59e0b', boxShadow: `0 0 6px ${activeEntry ? '#4ade80' : '#f59e0b'}` }}></div>
                    {isMonitoring ? 'Tracking' : (activeEntry ? 'Live' : 'Off-Clock')}
                </div>

                <div className="session-info">
                    <h3>{activeEntry ? 'Current Session Active' : 'Start Your Shift'}</h3>
                    <div className="session-meta">
                        <span>📍 {getActiveSiteName()}</span>
                        {activeEntry && <span>🕐 Started: {activeEntry.startTime}</span>}
                    </div>
                </div>

                <div className="session-right">
                    {!activeEntry ? (
                        <>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', outline: 'none', appearance: 'none' }}
                            >
                                <option value="" disabled style={{ color: 'black' }}>Select Location</option>
                                <optgroup label="Office Sites">
                                    {sites.map(site => (
                                        <option key={site._id} value={`site_${site._id}`} style={{ color: 'black' }}>🏢 {site.name}</option>
                                    ))}
                                </optgroup>
                                {(homeLocation || locationRequests.length > 0) && (
                                    <optgroup label="My Locations">
                                        {homeLocation && (
                                            <option value="home_true" style={{ color: 'black' }}>🏠 {homeLocation.label || 'Home Location'}</option>
                                        )}
                                        {locationRequests.map((req: any) => (
                                            <option key={req._id} value={`request_${req._id}`} style={{ color: 'black' }}>
                                                {req.type === 'Home' ? '🏠' : '📍'} {req.locationName}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <button className="btn-checkout btn-checkin" onClick={handleCheckInAttempt} disabled={checkInLoading || !selectedLocation}>
                                ▶ Check In
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="shift-tag" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.4rem 0.8rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.15)' }}>
                                <span style={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Checked in at</span>
                                <span>{getActiveSiteName()}</span>
                            </div>
                            <button className="btn-checkout" onClick={() => setShowCheckInConfirm(true)} disabled={checkInLoading}>
                                ⏹ Check Out
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* STATS GRID */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-top-bar"></div>
                    <div className="stat-header">
                        <div className="stat-icon">⏱</div>
                        <div className="stat-period">This Month</div>
                    </div>
                    <div className="stat-value">{stats.totalHours.toFixed(1)}</div>
                    <div className="stat-name">Total Hours</div>
                    <div className="stat-sub">Approved hours logged</div>
                </div>

                <div className="stat-card amber">
                    <div className="stat-top-bar"></div>
                    <div className="stat-header">
                        <div className="stat-icon">🔥</div>
                        <div className="stat-period">This Month</div>
                    </div>
                    <div className="stat-value">{stats.otHours.toFixed(1)}</div>
                    <div className="stat-name">OT Hours</div>
                    <div className="stat-sub">Approved overtime</div>
                </div>

                <div className="stat-card green">
                    <div className="stat-top-bar"></div>
                    <div className="stat-header">
                        <div className="stat-icon">🌴</div>
                        <div className="stat-period">This Month</div>
                    </div>
                    <div className="stat-value">{stats.leaveTaken}</div>
                    <div className="stat-name">Leave Taken</div>
                    <div className="stat-sub">{24 - stats.leaveTaken} days remaining</div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-top-bar"></div>
                    <div className="stat-header">
                        <div className="stat-icon">📋</div>
                        <div className="stat-period">Pending</div>
                    </div>
                    <div className="stat-value">{stats.pendingRequests}</div>
                    <div className="stat-name">Requests</div>
                    <div className="stat-sub">Awaiting approval</div>
                </div>
            </div>

            <div className="bottom-grid">
                <div className="panel">
                    <div className="panel-head">
                        <div className="panel-title">
                            <div className="panel-icon" style={{ background: 'var(--accent-light)' }}>⚡</div>
                            Quick Actions
                        </div>
                    </div>
                    <div className="panel-body">
                        <div className="qa-grid">
                            <a href="/staff/time-entries" className="qa-btn">
                                <div className="qa-icon">📋</div>
                                <div className="qa-label">Time List</div>
                            </a>
                            <a href="/staff/overtime" className="qa-btn">
                                <div className="qa-icon">⏰</div>
                                <div className="qa-label">Apply Overtime</div>
                            </a>
                            <a href="/staff/leave" className="qa-btn">
                                <div className="qa-icon">🌴</div>
                                <div className="qa-label">Apply Leave</div>
                            </a>
                        </div>

                        <div className="chart-label-row">
                            <div className="chart-title-sm">Weekly Attendance</div>
                            <div className="chart-legend"><div className="legend-dot"></div> Present</div>
                        </div>
                        <div className="mini-bars">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                                const heights = ['25%', '80%', '65%', '90%', '50%', '15%', '25%'];
                                const isToday = dayIdx === currentDayIdx;
                                const isPast = dayIdx < currentDayIdx;
                                const bg = isToday ? 'var(--accent)' : (isPast ? '#93c5fd' : '#e2e8f0');
                                return (
                                    <div
                                        key={dayIdx}
                                        className="mini-bar"
                                        style={{ height: heights[dayIdx], background: bg, animationDelay: `${0.05 + dayIdx * 0.05}s` }}
                                    ></div>
                                );
                            })}
                        </div>
                        <div className="week-labels">
                            <div className="week-label">Mon</div>
                            <div className="week-label">Tue</div>
                            <div className="week-label">Wed</div>
                            <div className="week-label">Thu</div>
                            <div className="week-label">Fri</div>
                            <div className="week-label">Sat</div>
                            <div className="week-label">Sun</div>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-head">
                        <div className="panel-title">
                            <div className="panel-icon" style={{ background: 'var(--green-light)' }}>📌</div>
                            Session Summary
                        </div>
                        <a href="/staff/time-entries" className="panel-link">View History →</a>
                    </div>
                    <div className="panel-body">
                        <div className="status-row">
                            <div className="status-label">Attendance Status</div>
                            <div className="status-val">
                                <div className="status-dot" style={{ background: activeEntry ? '#10b981' : '#f59e0b', boxShadow: `0 0 5px ${activeEntry ? '#10b981' : '#f59e0b'}` }}></div>
                                {activeEntry ? 'Checked In' : 'Checked Out'}
                            </div>
                        </div>
                        <div className="status-row">
                            <div className="status-label">Leave Balance</div>
                            <div className="status-val" style={{ color: 'var(--green)' }}>{24 - stats.leaveTaken} Days</div>
                        </div>
                        <div className="status-row">
                            <div className="status-label">Current Shift</div>
                            <div className="status-val">Standard Shift</div>
                        </div>
                        <div className="status-row">
                            <div className="status-label">Check-in Time</div>
                            <div className="status-val" style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>
                                {activeEntry ? activeEntry.startTime : '-- : --'}
                            </div>
                        </div>
                        <div className="status-row">
                            <div className="status-label">Site</div>
                            <div className="status-val">{getActiveSiteName() !== 'No Active Site' ? getActiveSiteName() : 'N/A'}</div>
                        </div>

                        <div className="timeline-section">
                            <div className="tl-head">Today's Log</div>
                            {activeEntry ? (
                                <div className="tl-item">
                                    <div className="tl-dot-wrap">
                                        <div className="tl-dot" style={{ background: '#10b981' }}></div>
                                        <div className="tl-line"></div>
                                    </div>
                                    <div className="tl-info">
                                        <div className="tl-title">Session Started</div>
                                        <div className="tl-sub">Standard Shift · {getActiveSiteName() !== 'No Active Site' ? getActiveSiteName() : 'Unknown Site'}</div>
                                    </div>
                                    <div className="tl-time">{activeEntry.startTime}</div>
                                </div>
                            ) : (
                                <div className="tl-item">
                                    <div className="tl-dot-wrap">
                                        <div className="tl-dot" style={{ background: '#cbd5e1' }}></div>
                                        <div className="tl-line"></div>
                                    </div>
                                    <div className="tl-info">
                                        <div className="tl-title">Not Checked In</div>
                                        <div className="tl-sub">Your session hasn't started yet</div>
                                    </div>
                                    <div className="tl-time">—</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showCheckInConfirm && (
                <>
                    <div className={`modal-bg-overlay ${locationError ? 'error-state' : ''}`}></div>
                    <div className="modal-wrap">
                        <div className="modal">
                            <div className="modal-band"></div>
                            <div className="modal-body">
                                {!locationError && (
                                    <div className="modal-logo">
                                        <img src="/assets/static/synaxislogo.svg" alt="Synaxis" />
                                    </div>
                                )}
                                <div className="icon-ring">
                                    {!locationError ? (
                                        <span className="pin-icon">📍</span>
                                    ) : (
                                        <span className="warn-icon">📵</span>
                                    )}
                                </div>
                                <h2>{activeEntry ? 'Confirm Check Out' : (locationError ? 'Location Unavailable' : 'Ready to Start?')}</h2>
                                <p className="subtitle">
                                    {activeEntry
                                        ? 'Please take a final photo to verify you are leaving the site.'
                                        : (locationError
                                            ? <>Location access unavailable. Check-in will be <strong style={{ color: '#1c1917' }}>flagged for review.</strong></>
                                            : 'Position tracking active for site verification.')}
                                </p>

                                <div className="verification-photo-section">
                                    {photoPreview ? (
                                        <div className="photo-preview-wrap">
                                            <img src={photoPreview} alt="Selfie" className="selfie-img" />
                                            <button
                                                className="remove-photo"
                                                onClick={() => {
                                                    setCapturedPhoto(null);
                                                    setPhotoPreview(null);
                                                }}
                                            >
                                                <X size={14} /> Retake
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="photo-placeholder" onClick={() => setShowCamera(true)}>
                                            <div className="camera-icon-wrap">
                                                <Camera size={32} color="var(--accent)" />
                                            </div>
                                            <span>{activeEntry ? 'Take Checkout Selfie' : 'Take Check-in Selfie'}</span>
                                            <p>Real-time camera required</p>
                                        </div>
                                    )}
                                </div>

                                {locationError && !activeEntry && (
                                    <div
                                        style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107', color: '#856404', fontSize: '0.85rem' }}
                                    >
                                        ⚠️ <strong>Location required:</strong> {locationError}
                                    </div>
                                )}

                                <div className="divider" style={{ margin: '1rem 0', height: '1px', background: '#e2e8f0' }}></div>

                                <div className="btn-row" style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className="btn btn-cancel"
                                        onClick={() => setShowCheckInConfirm(false)}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    >
                                        ✕ Cancel
                                    </button>
                                    <button
                                        className="btn btn-checkin"
                                        onClick={() => activeEntry ? handleCheckOut() : handleCheckIn(false)}
                                        disabled={!!(checkInLoading || !capturedPhoto || (!activeEntry && !!locationError))}
                                        style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', opacity: (!activeEntry && !!locationError) ? 0.5 : 1 }}
                                    >
                                        {checkInLoading ? 'Syncing...' : (activeEntry ? '✓ Confirm Check Out' : '✓ Check In')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {showCamera && (
                <CameraCapture 
                    onCapture={handleCapture}
                    onClose={handleCameraClose}
                />
            )}
        </div>
    );
};
