import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Location, GeofenceConfig } from '../utils/geofence';
import { getCurrentLocation, watchLocation, clearWatch, isWithinGeofence as checkIsWithinGeofence } from '../utils/geofence';

interface GeofenceContextType {
    isWithinGeofence: boolean;
    isMonitoring: boolean;
    currentLocation: Location | null;
    geofence: GeofenceConfig | null;
    startMonitoring: (geofence: GeofenceConfig, onAutoCheckOut?: () => void) => void;
    stopMonitoring: () => void;
    warningShown: boolean;
    setWarningShown: (shown: boolean) => void;
    countdown: number;
    startCountdown: () => void;
    stopCountdown: () => void;
    locationOffWarningShown: boolean;
    setLocationOffWarningShown: (shown: boolean) => void;
    locationOffCountdown: number;
    startLocationOffCountdown: () => void;
    stopLocationOffCountdown: () => void;
    onAutoCheckOut?: () => void;
}

const GeofenceContext = createContext<GeofenceContextType | undefined>(undefined);

export const useGeofence = () => {
    const context = useContext(GeofenceContext);
    if (!context) {
        throw new Error('useGeofence must be used within a GeofenceProvider');
    }
    return context;
};

interface GeofenceProviderProps {
    children: React.ReactNode;
}

export const GeofenceProvider: React.FC<GeofenceProviderProps> = ({ children }) => {
    const [isWithinGeofence, setIsWithinGeofence] = useState(true);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [geofence, setGeofence] = useState<GeofenceConfig | null>(null);
    const [warningShown, setWarningShown] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [locationOffWarningShown, setLocationOffWarningShown] = useState(false);
    const [locationOffCountdown, setLocationOffCountdown] = useState(30);

    const watchIdRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<any>(null);
    const locationOffCountdownIntervalRef = useRef<any>(null);
    const locationErrorCountRef = useRef(0);
    const onAutoCheckOutRef = useRef<(() => void) | undefined>(undefined);

    const stopCountdown = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setCountdown(30);
    }, []);

    const stopLocationOffCountdown = useCallback(() => {
        if (locationOffCountdownIntervalRef.current) {
            clearInterval(locationOffCountdownIntervalRef.current);
            locationOffCountdownIntervalRef.current = null;
        }
        setLocationOffCountdown(30);
    }, []);

    const handleAutoCheckOut = useCallback(async () => {
        console.log('GeofenceContext: handleAutoCheckOut triggered');
        setWarningShown(false);
        setLocationOffWarningShown(false);
        setIsWithinGeofence(true); // Reset state

        if (onAutoCheckOutRef.current) {
            try {
                await onAutoCheckOutRef.current();
            } catch (err) {
                console.error('Auto checkout failed:', err);
            }
        } else {
            console.log('No auto checkout handler, logging out');
            localStorage.removeItem('hrms_token');
            localStorage.removeItem('hrms_user');
            window.location.href = '/login';
        }
    }, []);

    const startCountdown = useCallback(() => {
        setCountdown(30);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    stopCountdown();
                    handleAutoCheckOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [handleAutoCheckOut, stopCountdown]);

    const startLocationOffCountdown = useCallback(() => {
        setLocationOffCountdown(30);

        locationOffCountdownIntervalRef.current = setInterval(() => {
            setLocationOffCountdown(prev => {
                if (prev <= 1) {
                    stopLocationOffCountdown();
                    handleAutoCheckOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [handleAutoCheckOut, stopLocationOffCountdown]);

    const checkLocation = useCallback(async (location: Location) => {
        console.log('GeofenceContext: checkLocation called', location);
        if (!geofence) {
            console.log('GeofenceContext: no geofence set');
            return;
        }

        locationErrorCountRef.current = 0;

        if (locationOffWarningShown) {
            console.log('GeofenceContext: hiding location off warning');
            setLocationOffWarningShown(false);
            stopLocationOffCountdown();
        }

        const within = checkIsWithinGeofence(location, geofence);
        console.log('GeofenceContext: location check result', { within, geofence });
        setCurrentLocation(location);

        if (within !== isWithinGeofence) {
            console.log('GeofenceContext: geofence status changed', { from: isWithinGeofence, to: within });
            setIsWithinGeofence(within);

            if (!within) {
                console.log('GeofenceContext: starting geofence warning');
                setWarningShown(true);
                startCountdown();
            } else {
                console.log('GeofenceContext: stopping geofence warning');
                setWarningShown(false);
                stopCountdown();
            }
        }
    }, [geofence, isWithinGeofence, locationOffWarningShown, startCountdown, stopCountdown, stopLocationOffCountdown]);

    const stopMonitoring = useCallback(() => {
        if (watchIdRef.current !== null) {
            clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsMonitoring(false);
        setWarningShown(false);
        setLocationOffWarningShown(false);
        stopCountdown();
        stopLocationOffCountdown();
        locationErrorCountRef.current = 0;
    }, [stopCountdown, stopLocationOffCountdown]);

    const startMonitoring = useCallback((newGeofence: GeofenceConfig, onAutoCheckOut?: () => void) => {
        console.log('GeofenceContext: startMonitoring called', newGeofence);
        stopMonitoring();

        setGeofence(newGeofence);
        setIsMonitoring(true);
        onAutoCheckOutRef.current = onAutoCheckOut;

        getCurrentLocation()
            .then(location => {
                checkLocation(location);
                watchIdRef.current = watchLocation(
                    checkLocation,
                    (error) => {
                        console.error('GeofenceContext: location watching error', error);
                        locationErrorCountRef.current++;
                        if (locationErrorCountRef.current >= 3 && !locationOffWarningShown) {
                            setLocationOffWarningShown(true);
                            startLocationOffCountdown();
                        }
                    }
                );
            })
            .catch(error => {
                console.error('GeofenceContext: failed to get initial location:', error);
                locationErrorCountRef.current++;
                if (locationErrorCountRef.current >= 2 && !locationOffWarningShown) {
                    setLocationOffWarningShown(true);
                    startLocationOffCountdown();
                }
            });
    }, [checkLocation, locationOffWarningShown, startLocationOffCountdown, stopMonitoring]);

    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    }, [stopMonitoring]);

    const value: GeofenceContextType = {
        isWithinGeofence,
        isMonitoring,
        currentLocation,
        geofence,
        startMonitoring,
        stopMonitoring,
        warningShown,
        setWarningShown,
        countdown,
        startCountdown,
        stopCountdown,
        locationOffWarningShown,
        setLocationOffWarningShown,
        locationOffCountdown,
        startLocationOffCountdown,
        stopLocationOffCountdown,
        onAutoCheckOut: onAutoCheckOutRef.current
    };

    return (
        <GeofenceContext.Provider value={value}>
            {children}
        </GeofenceContext.Provider>
    );
};
