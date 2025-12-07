import express from 'express';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import upload from '../config/multer.js';
import logAudit from '../utils/auditLogger.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get settings
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const settings = await Settings.getSingleton();
        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/settings
// @desc    Update settings
// @access  Private (Admin only)
router.put('/', protect, isAdmin, async (req, res) => {
    try {
        const settings = await Settings.getSingleton();

        const oldValue = { ...settings.toObject() };

        // Update allowed fields
        const allowedFields = [
            'timezone',
            'currency',
            'companyName',
            'companyAddress',
            'workingHoursPerDay',
            'globalOtRate',
            'leaveTypes',
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                settings[field] = req.body[field];
            }
        });

        await settings.save();

        await logAudit({
            userId: req.user._id,
            action: 'CHANGE_SETTINGS',
            resource: 'Settings',
            resourceId: settings._id,
            description: 'Updated system settings',
            oldValue,
            newValue: settings,
            req,
        });

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/settings/logo
// @desc    Upload company logo
// @access  Private (Admin only)
router.post('/logo', protect, isAdmin, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const settings = await Settings.getSingleton();
        settings.companyLogo = req.file.path;
        await settings.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPLOAD_DOCUMENT',
            resource: 'Settings',
            resourceId: settings._id,
            description: 'Uploaded company logo',
            req,
        });

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
