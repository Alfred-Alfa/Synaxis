import jwt from 'jsonwebtoken'; // Added import for jsonwebtoken
import Staff from '../models/Staff.js'; // Changed User to Staff and updated import

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Changed from verifyToken to jwt.verify

            // The original code had checks for decoded and req.user, which are good practice.
            // Re-adding them based on the original structure, assuming the user's intent was to modify the verification method and model, not remove these checks.
            if (!decoded) {
                return res.status(401).json({ message: 'Not authorized, token invalid' });
            }

            // Get user from token
            req.user = await Staff.findById(decoded.id).select('-password'); // Changed User to Staff

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user?.role || 'unknown'} is not authorized to access this route`
            });
        }
        next();
    };
};
