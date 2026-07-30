/**
 * Portal Mode Detection
 * 
 * - Port 8000 (Express backend): Admin / SuperAdmin portal
 * - Port 3000 (Vite dev server): Staff / Employee portal
 */

export type PortalMode = 'admin' | 'staff';

export const getPortalMode = (): PortalMode => {
    const port = window.location.port;
    // Port 8000 = served by Express = Admin portal
    // Port 3000 = Vite dev server = Staff portal
    // In production (no explicit port 80/443) default to admin
    if (port === '3000') return 'staff';
    return 'admin'; // 8000 or production serve = admin
};

export const isAdminPortal = (): boolean => getPortalMode() === 'admin';
export const isStaffPortal = (): boolean => getPortalMode() === 'staff';
