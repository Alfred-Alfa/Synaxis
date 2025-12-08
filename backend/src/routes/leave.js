import express from 'express';
import Leave from '../models/Leave.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import upload from '../config/multer.js';
import logAudit from '../utils/auditLogger.js';
import { sendNotification, notifyAdmins } from '../utils/notification.js';

const router = express.Router();

// @route   GET /api/leave
// @desc    Get all leave applications (Admin: all, Staff: own)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'Staff' || req.query.mode === 'personal') {
            query.staffId = req.user.staffRef;
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.leaveType) {
            query.leaveType = req.query.leaveType;
        }

        const leaves = await Leave.find(query)
            .populate('staffId', 'fullName email')
            .populate('approvedBy', 'email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: leaves.length,
            data: leaves,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ... GET /:id route remains same ...

// @route   POST /api/leave
// @desc    Create leave application
// @access  Private (Staff)
router.post('/', protect, upload.single('attachment'), async (req, res) => {
    try {
        const {
            leaveType,
            startDate,
            endDate,
            isHalfDay,
            reason,
        } = req.body;

        const isAdminUser = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        const leave = await Leave.create({
            staffId: req.user.staffRef,
            leaveType,
            startDate,
            endDate,
            isHalfDay: isHalfDay === 'true' || isHalfDay === true,
            reason,
            attachment: req.file ? { path: req.file.path } : undefined,
            status: isAdminUser ? 'Approved' : 'Pending',
            approvedBy: isAdminUser ? req.user._id : undefined,
            approvedAt: isAdminUser ? new Date() : undefined,
            approvalComment: isAdminUser ? 'Auto-approved for Admin' : undefined
        });

        await logAudit({
            userId: req.user._id,
            action: 'CREATE',
            resource: 'Leave',
            resourceId: leave._id,
            description: isAdminUser ? `Submitted and auto-approved ${leaveType} leave` : `Submitted ${leaveType} leave application`,
            newValue: leave,
            req,
        });

        // Notify Admins only if not auto-approved
        if (!isAdminUser) {
            await notifyAdmins({
                title: 'New Leave Application',
                message: `New ${leaveType} leave application for ${leave.totalDays} days`,
                link: '/admin/leave',
                type: 'INFO',
            });
        }

        res.status(201).json({
            success: true,
            data: leave,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/leave/:id
// @desc    Update leave (only Pending)
// @access  Private (Staff - own entries only)
router.put('/:id', protect, async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.staffId.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot update ${leave.status} leave` });
        }

        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== 'status' && key !== 'staffId') {
                leave[key] = req.body[key];
            }
        });

        await leave.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Leave',
            resourceId: leave._id,
            description: 'Updated leave application',
            req,
        });

        res.json({
            success: true,
            data: leave,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/leave/:id
// @desc    Delete leave (only Pending)
// @access  Private (Staff - own entries only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.staffId.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot delete ${leave.status} leave` });
        }

        await leave.deleteOne();

        await logAudit({
            userId: req.user._id,
            action: 'DELETE',
            resource: 'Leave',
            resourceId: leave._id,
            description: 'Deleted leave application',
            req,
        });

        res.json({
            success: true,
            message: 'Leave deleted',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/leave/:id/approve
// @desc    Approve leave
// @access  Private (Admin only)
router.post('/:id/approve', protect, isAdmin, async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending leave can be approved' });
        }

        const { comment } = req.body;

        leave.status = 'Approved';
        leave.approvedBy = req.user._id;
        leave.approvedAt = new Date();
        if (comment) leave.approvalComment = comment;

        await leave.save();

        await logAudit({
            userId: req.user._id,
            action: 'APPROVE',
            resource: 'Leave',
            resourceId: leave._id,
            description: 'Approved leave application',
            req,
        });

        // Notify Staff
        await sendNotification({
            staffId: leave.staffId,
            title: 'Leave Application Approved',
            message: `Your leave application for ${leave.totalDays} days starting ${new Date(leave.startDate).toLocaleDateString()} has been approved.${comment ? ` Remark: ${comment}` : ''}`,
            type: 'SUCCESS',
            link: '/staff/leave',
        });

        res.json({
            success: true,
            data: leave,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/leave/:id/reject
// @desc    Reject leave
// @access  Private (Admin only)
router.post('/:id/reject', protect, isAdmin, async (req, res) => {
    try {
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: 'Rejection comment is required' });
        }

        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending leave can be rejected' });
        }

        leave.status = 'Rejected';
        leave.rejectionComment = comment;
        leave.approvedBy = req.user._id;
        leave.approvedAt = new Date();

        await leave.save();

        await logAudit({
            userId: req.user._id,
            action: 'REJECT',
            resource: 'Leave',
            resourceId: leave._id,
            description: `Rejected leave: ${comment}`,
            req,
        });

        // Notify Staff
        await sendNotification({
            staffId: leave.staffId,
            title: 'Leave Application Rejected',
            message: `Your leave application has been rejected. Reason: ${comment}`,
            type: 'ERROR',
            link: '/staff/leave',
        });

        res.json({
            success: true,
            data: leave,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
