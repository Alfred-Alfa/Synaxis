import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { isAdmin, isSuperAdmin } from '../middleware/rbac.js';
import upload from '../config/multer.js';
import logAudit from '../utils/auditLogger.js';
import { syncStaffUsers } from '../utils/syncStaffUsers.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';

import Settings from '../models/Settings.js';

const router = express.Router();

// @route   GET /api/staff
// @desc    Get all staff
// @access  Private (Admin or Staff can see their own)
router.get('/', protect, async (req, res) => {
    try {
        let matchStage = {};

        // If staff user, only show their own record
        if (req.user.role === 'Staff') {
            matchStage._id = req.user.staffRef;
        }

        const staff = await Staff.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'staffRef',
                    as: 'userInfo'
                }
            },
            {
                $addFields: {
                    role: { $arrayElemAt: ['$userInfo.role', 0] }
                }
            },
            {
                $project: {
                    userInfo: 0 // Remove the full user object to keep response clean
                }
            }
        ]);

        res.json({
            success: true,
            count: staff.length,
            data: staff,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/staff/:id
// @desc    Get staff by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const staffDocs = await Staff.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'staffRef',
                    as: 'userInfo'
                }
            },
            {
                $addFields: {
                    role: { $arrayElemAt: ['$userInfo.role', 0] }
                }
            },
            {
                $project: {
                    userInfo: 0
                }
            }
        ]);

        if (!staffDocs || staffDocs.length === 0) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const staff = staffDocs[0];

        // Staff can only view their own record
        if (req.user.role === 'Staff' && staff._id.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            success: true,
            data: staff,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/staff
// @desc    Create new staff
// @access  Private (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            hourlyRate,
            address,
            startDate,
            designation,
            bankDetails,
            password,
            otRate,
            role, // Added role
        } = req.body;

        // Check if staff with email already exists
        const existingStaff = await Staff.findOne({ email });
        if (existingStaff) {
            return res.status(400).json({ message: 'Staff with this email already exists' });
        }

        // Create staff
        const staff = await Staff.create({
            fullName,
            email,
            phone,
            hourlyRate,
            address,
            startDate,
            designation,
            bankDetails,
            otRate,
        });

        // Determine user role (default to Staff)
        const userRole = (role && ['Admin', 'Staff'].includes(role)) ? role : 'Staff';
        const tempPassword = password || 'password123';

        // Create user account for staff
        const user = await User.create({
            email,
            password: tempPassword, // Default password
            role: userRole,
            staffRef: staff._id,
        });

        // Send welcome email with credentials
        let emailSent = false;
        try {
            // Fetch company name from settings
            const settings = await Settings.getSingleton();
            const companyName = settings.companyName || 'HRMS';

            const emailResult = await sendWelcomeEmail(email, tempPassword, fullName, companyName);
            emailSent = !!(emailResult && emailResult.success);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // We continue even if email fails
        }

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'CREATE',
            resource: 'Staff',
            resourceId: staff._id,
            description: `Created staff: ${fullName} with role ${userRole}`,
            newValue: staff,
            req,
        });

        res.status(201).json({
            success: true,
            data: staff,
            emailSent,
            message: 'Staff created successfully',
            user: {
                email: user.email,
                role: user.role,
                tempPassword: tempPassword,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/staff/:id
// @desc    Update staff
// @access  Private (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const oldValue = { ...staff.toObject() };

        // Check if hourly rate is being updated
        if (req.body.hourlyRate && req.body.hourlyRate !== staff.hourlyRate) {
            staff.hourlyRateHistory.push({
                rate: req.body.hourlyRate,
                effectiveDate: new Date(),
                changedBy: req.user._id,
            });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key !== 'hourlyRateHistory' && key !== 'role' && req.body[key] !== undefined) {
                staff[key] = req.body[key];
            }
        });

        await staff.save();

        if (req.body.role && ['Admin', 'Staff', 'SuperAdmin'].includes(req.body.role)) {
            // Update User role
            await User.findOneAndUpdate(
                { staffRef: staff._id },
                { role: req.body.role },
                { new: true }
            );
        }

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            entity: 'Staff',
            entityId: staff._id,
            oldValue,
            newValue: staff,
            req,
        });

        res.json({
            success: true,
            data: staff,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/staff/:id
// @desc    Deactivate staff
// @access  Private (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        staff.employmentStatus = 'Inactive';
        await staff.save();

        // Also deactivate user account
        await User.findOneAndUpdate(
            { staffRef: staff._id },
            { isActive: false }
        );

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Staff',
            resourceId: staff._id,
            description: `Deactivated staff: ${staff.fullName}`,
            req,
        });

        res.json({
            success: true,
            message: 'Staff deactivated successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/staff/:id/documents
// @desc    Upload staff documents
// @access  Private (Admin only)
router.post('/:id/documents', protect, isAdmin, upload.single('document'), async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        staff.documents.push({
            name: req.body.documentName || req.file.originalname,
            path: req.file.path,
        });

        await staff.save();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'UPLOAD_DOCUMENT',
            resource: 'Staff',
            resourceId: staff._id,
            description: `Uploaded document for staff: ${staff.fullName}`,
            req,
        });

        res.json({
            success: true,
            data: staff.documents,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/staff/sync-users
// @desc    Sync Staff-User relationships (create missing User accounts)
// @access  Private (SuperAdmin only)
router.post('/sync-users', protect, isSuperAdmin, async (req, res) => {
    try {
        const result = await syncStaffUsers();

        res.json({
            success: true,
            message: 'Staff-User sync completed',
            data: result,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/staff/:id/reset-password
// @desc    Admin resets staff password and sends reset email
// @access  Private (Admin only)
router.post('/:id/reset-password', protect, isAdmin, async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        // Find user account
        const user = await User.findOne({ staffRef: staff._id });

        if (!user) {
            return res.status(404).json({ message: 'User account not found for this staff member' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        await sendPasswordResetEmail(user.email, resetToken, staff.fullName);

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'ADMIN_PASSWORD_RESET',
            entity: 'User',
            entityId: user._id,
            description: `Admin ${req.user.email} initiated password reset for ${staff.fullName}`,
            req,
        });

        res.json({
            success: true,
            message: `Password reset email sent to ${staff.fullName} at ${user.email}`,
        });
    } catch (error) {
        console.error('Admin password reset error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
