import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import logAudit from '../utils/auditLogger.js';

const router = express.Router();

// @route   POST /api/auth/change-password
// @desc    Change password (for logged-in users, including first-time password change)
// @access  Private
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);

        // Check current password (skip for first login)
        if (!user.isFirstLogin) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required' });
            }

            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
        }

        // Update password
        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        // Log audit
        await logAudit({
            userId: user._id,
            action: 'UPDATE',
            resource: 'User',
            resourceId: user._id,
            description: user.isFirstLogin ? 'First-time password change' : 'Password changed',
            req,
        });

        res.json({
            success: true,
            message: 'Password changed successfully',
            isFirstLogin: false,
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/request-reset
// @desc    Request password reset (generates token and sends email)
// @access  Public
router.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email }).populate('staffRef');
        if (!user) {
            // Don't reveal if user exists
            return res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send email
        const userName = user.staffRef?.fullName || user.email;
        const origin = req.headers.origin || req.headers.referer || process.env.FRONTEND_URL;
        await sendPasswordResetEmail(user.email, resetToken, userName, origin);

        // Log audit
        await logAudit({
            userId: user._id,
            action: 'UPDATE',
            resource: 'User',
            resourceId: user._id,
            description: 'Password reset requested',
            req,
        });

        res.json({
            success: true,
            message: 'Password reset email sent successfully',
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Failed to process password reset request' });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { token } = req.params;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash token to compare
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.isFirstLogin = false;
        await user.save();

        // Log audit
        await logAudit({
            userId: user._id,
            action: 'UPDATE',
            resource: 'User',
            resourceId: user._id,
            description: 'Password reset via email link',
            req,
        });

        res.json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
