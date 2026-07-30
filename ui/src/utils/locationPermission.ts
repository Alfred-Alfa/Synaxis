import { getCurrentLocation } from './geofence';

export interface LocationPermissionStatus {
    granted: boolean;
    canPrompt: boolean;
    error?: string;
}

/**
 * Check if location permission is granted
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
    if (!navigator.geolocation) {
        return {
            granted: false,
            canPrompt: false,
            error: 'Geolocation is not supported by this device'
        };
    }

    // Check permission status if Permissions API is available
    if ('permissions' in navigator) {
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            return {
                granted: permission.state === 'granted',
                canPrompt: permission.state !== 'denied'
            };
        } catch (error) {
            // Permissions API not available, fall back to trying to get location
        }
    }

    // Fall back: Try to get current location to check if permission is granted
    try {
        await getCurrentLocation();
        return {
            granted: true,
            canPrompt: true
        };
    } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('denied') || errorMessage.includes('permission')) {
            return {
                granted: false,
                canPrompt: false,
                error: 'Location permission denied'
            };
        } else {
            return {
                granted: false,
                canPrompt: true,
                error: errorMessage
            };
        }
    }
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
    if (!navigator.geolocation) {
        return {
            granted: false,
            canPrompt: false,
            error: 'Geolocation is not supported by this device'
        };
    }

    try {
        await getCurrentLocation();
        return {
            granted: true,
            canPrompt: true
        };
    } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('denied') || errorMessage.includes('permission')) {
            return {
                granted: false,
                canPrompt: false,
                error: 'Location permission denied. Please enable location in your device settings.'
            };
        } else {
            return {
                granted: false,
                canPrompt: true,
                error: errorMessage
            };
        }
    }
}

/**
 * Check if location is enabled and working
 */
export async function isLocationWorking(): Promise<boolean> {
    try {
        await getCurrentLocation();
        return true;
    } catch (error) {
        return false;
    }
}
