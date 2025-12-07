import express from 'express';
import Overtime from '../models/Overtime.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import upload from '../config/multer.js';
import logAudit from '../utils/auditLogger.js';
import { sendNotification, notifyAdmins } from '../utils/notification.js';

const router = express.Router();

// @route   GET /api/overtime
// @desc    Get all overtime entries (Admin: all, Staff: own)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'Staff') {
            query.staffId = req.user.staffRef;
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.startDate || req.query.endDate) {
            query.date = {};
            if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
            if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
        }

        const overtime = await Overtime.find(query)
            .populate('staffId', 'fullName email')
            .populate('siteId', 'name location')
            .populate('approvedBy', 'email')
            .sort({ date: -1 });

        res.json({
            success: true,
            count: overtime.length,
            data: overtime,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/overtime/:id
// @desc    Get overtime by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const overtime = await Overtime.findById(req.params.id)
            .populate('staffId', 'fullName email')
            .populate('siteId', 'name location')
            .populate('approvedBy', 'email');

        if (!overtime) {
            return res.status(404).json({ message: 'Overtime not found' });
        }

        if (req.user.role === 'Staff' && overtime.staffId._id.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            success: true,
            data: overtime,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/overtime
// @desc    Create overtime request
// @access  Private (Staff)
router.post('/', protect, upload.single('attachment'), async (req, res) => {
    try {
        const {
            date,
            startTime,
            endTime,
            otHours,
            siteId,
            reason,
        } = req.body;

        const overtime = await Overtime.create({
            staffId: req.user.staffRef,
            date,
            startTime,
            endTime,
            otHours: parseFloat(otHours),
            siteId,
            reason,
            attachment: req.file ? { path: req.file.path } : undefined,
        });

        await logAudit({
            userId: req.user._id,
            action: 'CREATE',
            resource: 'Overtime',
            resourceId: overtime._id,
            description: 'Submitted overtime request',
            newValue: overtime,
            req,
        });

        // Notify Admins
        await notifyAdmins({
            title: 'New Overtime Request',
            message: `New overtime request for ${otHours} hours`,
            link: '/admin/overtime',
            type: 'INFO',
        });

        res.status(201).json({
            success: true,
            data: overtime,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/overtime/:id
// @desc    Update overtime (only Pending)
// @access  Private (Staff - own entries only)
router.put('/:id', protect, async (req, res) => {
    try {
        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({ message: 'Overtime not found' });
        }

        if (overtime.staffId.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (overtime.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot update ${overtime.status} overtime` });
        }

        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== 'status' && key !== 'staffId') {
                overtime[key] = req.body[key];
            }
        });

        await overtime.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Overtime',
            resourceId: overtime._id,
            description: 'Updated overtime request',
            req,
        });

        res.json({
            success: true,
            data: overtime,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/overtime/:id
// @desc    Delete overtime (only Pending)
// @access  Private (Staff - own entries only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({ message: 'Overtime not found' });
        }

        if (overtime.staffId.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (overtime.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot delete ${overtime.status} overtime` });
        }

        await overtime.deleteOne();

        await logAudit({
            userId: req.user._id,
            action: 'DELETE',
            resource: 'Overtime',
            resourceId: overtime._id,
            description: 'Deleted overtime request',
            req,
        });

        res.json({
            success: true,
            message: 'Overtime deleted',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/overtime/:id/approve
// @desc    Approve overtime
// @access  Private (Admin only)
router.post('/:id/approve', protect, isAdmin, async (req, res) => {
    try {
        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({ message: 'Overtime not found' });
        }

        if (overtime.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending overtime can be approved' });
        }

        const { comment } = req.body;

        overtime.status = 'Approved';
        overtime.approvedBy = req.user._id;
        overtime.approvedAt = new Date();
        if (comment) overtime.approvalComment = comment;

        await overtime.save();

        await logAudit({
            userId: req.user._id,
            action: 'APPROVE',
            resource: 'Overtime',
            resourceId: overtime._id,
            description: 'Approved overtime request',
            req,
        });

        // Notify Staff
        await sendNotification({
            staffId: overtime.staffId,
            title: 'Overtime Approved',
            message: `Your overtime request for ${new Date(overtime.date).toLocaleDateString()} has been approved.${comment ? ` Remark: ${comment}` : ''}`,
            type: 'SUCCESS',
            link: '/staff/overtime',
        });

        res.json({
            success: true,
            data: overtime,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/overtime/:id/reject
// @desc    Reject overtime
// @access  Private (Admin only)
router.post('/:id/reject', protect, isAdmin, async (req, res) => {
    try {
        const { reason, comment } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({ message: 'Overtime not found' });
        }

        if (overtime.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending overtime can be rejected' });
        }

        overtime.status = 'Rejected';
        overtime.rejectionReason = reason;
        overtime.rejectionComment = comment;
        overtime.approvedBy = req.user._id;
        overtime.approvedAt = new Date();

        await overtime.save();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'REJECT',
            resource: 'Overtime',
            resourceId: overtime._id,
            description: `Rejected overtime: ${reason}`,
            req,
        });

        // Notify Staff
        await sendNotification({
            staffId: overtime.staffId,
            title: 'Overtime Rejected',
            message: `Your overtime request for ${new Date(overtime.date).toLocaleDateString()} has been rejected. Reason: ${reason}`,
            type: 'ERROR',
            link: '/staff/overtime',
        });

        res.json({
            success: true,
            data: overtime,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
