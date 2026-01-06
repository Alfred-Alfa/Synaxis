import express from 'express';
import Settings from '../models/Settings.js';
import CompanyEmailSettings from '../models/CompanyEmailSettings.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import upload from '../config/multer.js';
import logAudit from '../utils/auditLogger.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import nodemailer from 'nodemailer';

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
        // Store only filename - the /uploads path is handled by static middleware
        settings.companyLogo = req.file.filename;
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

// @route   GET /api/settings/email
// @desc    Get email configuration
// @access  Private (Admin only)
router.get('/email', protect, isAdmin, async (req, res) => {
    try {
        const settings = await Settings.getSingleton();
        const emailSettings = await CompanyEmailSettings.findOne({ company_id: settings._id });

        if (!emailSettings) {
            return res.json({ success: true, data: null });
        }

        // Return config with masked password
        res.json({
            success: true,
            data: {
                ...emailSettings.toObject(),
                smtp_pass_encrypted: undefined,
                smtp_pass_masked: '********'
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/settings/email
// @desc    Update email configuration
// @access  Private (Admin only)
router.put('/email', protect, isAdmin, async (req, res) => {
    try {
        const {
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_pass,
            from_email,
            from_name,
            reply_to
        } = req.body;

        const settings = await Settings.getSingleton();

        // 1. Domain Validation
        // Ensure from_email matches the allowed domain (e.g., @webgeon.com)
        if (!from_email.endsWith('@webgeon.com')) {
            return res.status(400).json({
                message: 'Invalid domain. Email must be from @webgeon.com'
            });
        }

        // 2. Encrypt Password
        // Only encrypt if password is provided (not mask)
        let encryptedPass;
        if (smtp_pass && smtp_pass !== '********') {
            encryptedPass = encrypt(smtp_pass);
        } else {
            // Keep existing password if not changed
            const existing = await CompanyEmailSettings.findOne({ company_id: settings._id });
            if (existing) {
                encryptedPass = existing.smtp_pass_encrypted;
            } else {
                return res.status(400).json({ message: 'Password is required' });
            }
        }

        // 3. Upsert Settings
        const updateData = {
            provider: 'zeptomail',
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_pass_encrypted: encryptedPass,
            from_email,
            from_name,
            reply_to,
            // If changing anything, require re-verification
            is_verified: false,
            is_active: false
        };

        const emailSettings = await CompanyEmailSettings.findOneAndUpdate(
            { company_id: settings._id },
            updateData,
            { new: true, upsert: true }
        );

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE_EMAIL_CONFIG',
            resource: 'CompanyEmailSettings',
            resourceId: emailSettings._id,
            description: 'Updated SMTP configuration',
            req
        });

        res.json({
            success: true,
            message: 'Email configuration saved. Please verify to activate.',
            data: {
                ...emailSettings.toObject(),
                smtp_pass_encrypted: undefined
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/settings/email/test
// @desc    Test email configuration and verify
// @access  Private (Admin only)
router.post('/email/test', protect, isAdmin, async (req, res) => {
    try {
        const { test_email } = req.body;
        const settings = await Settings.getSingleton();

        if (!test_email) {
            return res.status(400).json({ message: 'Test email address is required' });
        }

        const config = await CompanyEmailSettings.findOne({ company_id: settings._id });

        if (!config) {
            return res.status(404).json({ message: 'No email configuration found to test' });
        }

        const decryptedPass = decrypt(config.smtp_pass_encrypted);

        if (!decryptedPass) {
            return res.status(500).json({ message: 'Failed to decrypt credentials' });
        }

        // Create temp transporter
        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: config.smtp_port,
            secure: config.smtp_port === 465,
            auth: {
                user: config.smtp_user,
                pass: decryptedPass
            }
        });

        // Send test mail
        await transporter.sendMail({
            from: `"${config.from_name}" <${config.from_email}>`,
            to: test_email,
            subject: 'Test Email - HRMS Configuration',
            html: `<p>This is a test email to verify your SMTP configuration.</p>`
        });

        // If successful, mark as verified and active
        config.is_verified = true;
        config.is_active = true;
        await config.save();

        await logAudit({
            userId: req.user._id,
            action: 'VERIFY_EMAIL_CONFIG',
            resource: 'CompanyEmailSettings',
            resourceId: config._id,
            description: `Email configuration verified and activated. Test sent to ${test_email}`,
            req
        });

        res.json({
            success: true,
            message: 'Test email sent successfully. Configuration is now active.'
        });

    } catch (error) {
        console.error('Email Test Error:', error);
        res.status(400).json({
            success: false,
            message: 'SMTP Verification Failed: ' + error.message
        });
    }
});

export default router;
