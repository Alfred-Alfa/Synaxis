import express from 'express';
import Site from '../models/Site.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import logAudit from '../utils/auditLogger.js';

const router = express.Router();

// @route   GET /api/sites
// @desc    Get all sites
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const query = req.query.status ? { status: req.query.status } : {};

        const sites = await Site.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: sites.length,
            data: sites,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/sites/:id
// @desc    Get site by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);

        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        res.json({
            success: true,
            data: site,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/sites
// @desc    Create site
// @access  Private (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { name, location, client, otRate } = req.body;

        const site = await Site.create({
            name,
            location,
            client,
            otRate: otRate ? parseFloat(otRate) : undefined,
        });

        await logAudit({
            userId: req.user._id,
            action: 'CREATE',
            resource: 'Site',
            resourceId: site._id,
            description: `Created site: ${name}`,
            newValue: site,
            req,
        });

        res.status(201).json({
            success: true,
            data: site,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/sites/:id
// @desc    Update site
// @access  Private (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);

        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        const oldValue = { ...site.toObject() };

        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                site[key] = req.body[key];
            }
        });

        await site.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Site',
            resourceId: site._id,
            description: `Updated site: ${site.name}`,
            oldValue,
            newValue: site,
            req,
        });

        res.json({
            success: true,
            data: site,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/sites/:id
// @desc    Deactivate site
// @access  Private (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);

        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        site.status = 'Inactive';
        await site.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Site',
            resourceId: site._id,
            description: `Deactivated site: ${site.name}`,
            req,
        });

        res.json({
            success: true,
            message: 'Site deactivated',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
