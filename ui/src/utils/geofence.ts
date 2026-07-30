// Geofencing utility functions

export interface Location {
    latitude: number;
    longitude: number;
}

export interface GeofenceConfig {
    center: Location;
    radius: number; // in meters
}

/**
 * Calculate distance between two points in meters using Haversine formula
 */
export function calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Check if a location is within a geofence
 */
export function isWithinGeofence(location: Location, geofence: GeofenceConfig): boolean {
    const distance = calculateDistance(location, geofence.center);
    return distance <= geofence.radius;
}

/**
 * Get current user location
 */
export function getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000 // Accept positions that are up to 1 minute old
            }
        );
    });
}

/**
 * Watch user location changes
 */
export function watchLocation(
    callback: (location: Location) => void,
    errorCallback?: (error: Error) => void
): number {
    if (!navigator.geolocation) {
        if (errorCallback) {
            errorCallback(new Error('Geolocation is not supported by this browser'));
        }
        return -1;
    }

    return navigator.geolocation.watchPosition(
        (position) => {
            callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
        },
        (error) => {
            if (errorCallback) {
                errorCallback(new Error(`Geolocation error: ${error.message}`));
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000 // Accept positions that are up to 30 seconds old
        }
    );
}

/**
 * Stop watching location changes
 */
export function clearWatch(watchId: number): void {
    if (watchId !== -1) {
        navigator.geolocation.clearWatch(watchId);
    }
}
