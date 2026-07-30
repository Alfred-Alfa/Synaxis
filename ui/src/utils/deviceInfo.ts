/**
 * Simple device fingerprinting utility
 */
export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('hrms_device_id');
    
    if (!deviceId) {
        // Generate a random UUID-like string if not present
        deviceId = 'dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
        localStorage.setItem('hrms_device_id', deviceId);
    }
    
    return deviceId;
};

export const getDeviceInfo = (): string => {
    const ua = navigator.userAgent;
    let deviceName = 'Browser';
    
    if (/iPhone/i.test(ua)) deviceName = 'iPhone';
    else if (/Android/i.test(ua)) deviceName = 'Android Device';
    else if (/iPad/i.test(ua)) deviceName = 'iPad';
    else if (/Macintosh/i.test(ua)) deviceName = 'Mac';
    else if (/Windows/i.test(ua)) deviceName = 'Windows PC';
    
    return deviceName;
};
