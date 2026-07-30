import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { isSuperAdmin } from '../middleware/rbac.js';

const router = express.Router();

// @route   GET /api/audit-logs
// @desc    Get audit logs with search and filters
// @access  Private (SuperAdmin only)
router.get('/', protect, isSuperAdmin, async (req, res) => {
    try {
        const query = {};

        // Filter by user
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        // Filter by action
        if (req.query.action) {
            query.action = req.query.action;
        }

        // Filter by resource
        if (req.query.resource) {
            query.resource = req.query.resource;
        }

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const logs = await AuditLog.find(query)
            .populate('userId', 'email role')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: logs,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
