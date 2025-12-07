import express from 'express';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import upload from '../config/multer.js';
import logAudit from '../utils/auditLogger.js';

const router = express.Router();

// @route   GET /api/staff
// @desc    Get all staff
// @access  Private (Admin or Staff can see their own)
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        // If staff user, only show their own record
        if (req.user.role === 'Staff') {
            query._id = req.user.staffRef;
        }

        const staff = await Staff.find(query).sort({ createdAt: -1 });

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
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

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

        // Create user account for staff
        const user = await User.create({
            email,
            password: password || 'password123', // Default password
            role: 'Staff',
            staffRef: staff._id,
        });

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'CREATE',
            resource: 'Staff',
            resourceId: staff._id,
            description: `Created staff: ${fullName}`,
            newValue: staff,
            req,
        });

        res.status(201).json({
            success: true,
            data: staff,
            user: {
                email: user.email,
                tempPassword: password || 'password123',
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
            if (key !== 'hourlyRateHistory' && req.body[key] !== undefined) {
                staff[key] = req.body[key];
            }
        });

        await staff.save();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Staff',
            resourceId: staff._id,
            description: `Updated staff: ${staff.fullName}`,
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

export default router;
