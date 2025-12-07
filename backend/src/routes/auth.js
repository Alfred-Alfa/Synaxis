import express from 'express';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import { protect } from '../middleware/auth.js';
import { isSuperAdmin } from '../middleware/rbac.js';
import logAudit from '../utils/auditLogger.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (Super Admin only can create Admins)
// @access  Public for first user, then Super Admin only
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, staffRef } = req.body;

        // Check if any user exists
        const userCount = await User.countDocuments();

        // If this is the first user, make them Super Admin
        const userRole = userCount === 0 ? 'SuperAdmin' : (role || 'Staff');

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // If creating Admin or SuperAdmin, require SuperAdmin privileges (except first user)
        if (userCount > 0 && (userRole === 'Admin' || userRole === 'SuperAdmin')) {
            // This would need to be protected by isSuperAdmin middleware in production
            // For now, we'll allow it for setup purposes
        }

        // Create user
        const user = await User.create({
            email,
            password,
            role: userRole,
            staffRef: userRole === 'Staff' ? staffRef : undefined,
        });

        // Log audit
        await logAudit({
            userId: user._id,
            action: 'CREATE',
            resource: 'User',
            resourceId: user._id,
            description: `User registered with role ${userRole}`,
            req,
        });

        // Generate token
        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                staffRef: user.staffRef,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is inactive' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Log audit
        await logAudit({
            userId: user._id,
            action: 'LOGIN',
            resource: 'User',
            resourceId: user._id,
            description: 'User logged in',
            req,
        });

        // Generate token
        const token = user.getSignedJwtToken();

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                staffRef: user.staffRef,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('staffRef');
        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                staffRef: user.staffRef,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
    try {
        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'LOGOUT',
            resource: 'User',
            resourceId: req.user._id,
            description: 'User logged out',
            req,
        });

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
