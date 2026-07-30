import Settings from '../models/Settings.js';

// Resolve custom roles safely
const getAccessLevel = async (roleName) => {
    if (['SuperAdmin', 'Admin', 'Staff'].includes(roleName)) return roleName;
    try {
        const settings = await Settings.findOne();
        const custom = settings?.customRoles?.find(r => r.name === roleName);
        return custom ? custom.accessLevel : 'Staff';
    } catch {
        return 'Staff';
    }
};

export const isSuperAdmin = async (req, res, next) => {
    if (!req.user) return res.status(403).json({ message: 'Access denied.' });
    const access = await getAccessLevel(req.user.role);
    if (access === 'SuperAdmin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }
};

export const isAdmin = async (req, res, next) => {
    if (!req.user) return res.status(403).json({ message: 'Access denied.' });
    const access = await getAccessLevel(req.user.role);
    if (access === 'Admin' || access === 'SuperAdmin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

export const isStaff = async (req, res, next) => {
    if (!req.user) return res.status(403).json({ message: 'Access denied.' });
    const access = await getAccessLevel(req.user.role);
    if (access === 'Staff') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Staff only.' });
    }
};

export const isAdminOrOwner = async (req, res, next) => {
    if (!req.user) return res.status(403).json({ message: 'Access denied.' });
    const access = await getAccessLevel(req.user.role);
    if (
        access === 'Admin' ||
        access === 'SuperAdmin' ||
        req.user._id.toString() === req.params.id
    ) {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied.' });
    }
};
