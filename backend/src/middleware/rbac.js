// Role-based access control middleware

export const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'SuperAdmin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin')) {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

export const isStaff = (req, res, next) => {
    if (req.user && req.user.role === 'Staff') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Staff only.' });
    }
};

export const isAdminOrOwner = (req, res, next) => {
    // Allow admin or the user accessing their own resources
    if (
        req.user &&
        (req.user.role === 'Admin' ||
            req.user.role === 'SuperAdmin' ||
            req.user._id.toString() === req.params.id)
    ) {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied.' });
    }
};
