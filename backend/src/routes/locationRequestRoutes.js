import express from 'express';
import LocationRequest from '../models/LocationRequest.js';
import Staff from '../models/Staff.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import logAudit from '../utils/auditLogger.js';

const router = express.Router();

// @route   GET /api/location-requests/my-locations
// @desc    Get all location requests + home location for the logged-in staff
// @access  Private (Staff)
router.get('/my-locations', protect, async (req, res) => {
    try {
        let staffRef = req.user.staffRef;

        // CRITICAL FIX: If staffRef is missing for a Staff user, attempt to find/create it
        if (!staffRef && req.user.role === 'Staff') {
            const Staff = (await import('../models/Staff.js')).default;
            const User = (await import('../models/User.js')).default;
            
            // Try matching by email
            let staff = await Staff.findOne({ email: req.user.email });
            
            if (!staff) {
                // Auto-create staff record if missing (e.g. manual user creation without staff record)
                staff = await Staff.create({
                    fullName: req.user.email.split('@')[0], // Fallback to email name
                    email: req.user.email,
                    hourlyRate: 0,
                    employeeId: `AUTO-${Date.now().toString().slice(-6)}`,
                    employmentStatus: 'Active'
                });
            }
            
            // Link the user to the staff record
            await User.findByIdAndUpdate(req.user._id, { staffRef: staff._id });
            staffRef = staff._id;
        }

        if (!staffRef) {
            return res.status(400).json({ message: 'No staff reference found for user' });
        }

        // Get own location requests
        const locationRequests = await LocationRequest.find({
            staffId: staffRef,
        }).sort({ createdAt: -1 });

        // Get Staff's built-in homeLocation if exists
        const staff = await Staff.findById(staffRef);

        const data = {
            requests: locationRequests,
            homeLocation: staff?.homeLocation?.coordinates?.latitude ? staff.homeLocation : null
        };

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/location-requests
// @desc    Create a new location request
// @access  Private (Staff)
router.post('/', protect, async (req, res) => {
    try {
        const { locationName, type, coordinates, radius, description } = req.body;
        const staffRef = req.user.staffRef;

        const newRequest = await LocationRequest.create({
            staffId: staffRef,
            locationName,
            type,
            coordinates,
            radius: radius || 150,
            description
        });

        await logAudit({
            userId: req.user._id,
            action: 'CREATE',
            resource: 'LocationRequest',
            resourceId: newRequest._id,
            description: 'Created a new location request',
            newValue: newRequest,
            req,
        });

        res.status(201).json({
            success: true,
            data: newRequest
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/location-requests/:id
// @desc    Update a location request (Pending or Rejected)
// @access  Private (Staff)
router.put('/:id', protect, async (req, res) => {
    try {
        const { locationName, type, coordinates, radius, description } = req.body;

        const request = await LocationRequest.findOne({
            _id: req.params.id,
            staffId: req.user.staffRef
        });

        if (!request) {
            return res.status(404).json({ message: 'Location request not found or unauthorized' });
        }

        if (request.status === 'Approved') {
            return res.status(400).json({ message: 'Cannot edit an approved location request' });
        }

        request.locationName = locationName || request.locationName;
        request.type = type || request.type;
        if (coordinates) request.coordinates = coordinates;
        if (radius) request.radius = radius;
        if (description) request.description = description;

        // If edited, maybe reset to Pending if it was rejected
        request.status = 'Pending';
        request.rejectionReason = undefined;

        await request.save();

        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/location-requests/:id
// @desc    Delete a location request (Pending or User-owned)
// @access  Private (Staff)
router.delete('/:id', protect, async (req, res) => {
    try {
        const request = await LocationRequest.findOne({
            _id: req.params.id,
            staffId: req.user.staffRef
        });

        if (!request) {
            return res.status(404).json({ message: 'Location request not found or unauthorized' });
        }

        await request.deleteOne();

        await logAudit({
            userId: req.user._id,
            action: 'DELETE',
            resource: 'LocationRequest',
            resourceId: request._id,
            description: 'Deleted location request',
            req,
        });

        res.json({ success: true, message: 'Location request deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/location-requests/admin
// @desc    Get all location requests (Admin)
// @access  Private (Admin)
router.get('/admin/all', protect, isAdmin, async (req, res) => {
    try {
        const requests = await LocationRequest.find()
            .populate('staffId', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/location-requests/:id/approve
// @desc    Approve location request
// @access  Private (Admin)
router.post('/:id/approve', protect, isAdmin, async (req, res) => {
    try {
        const request = await LocationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Location request not found' });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending requests can be approved' });
        }

        request.status = 'Approved';
        request.approvedBy = req.user._id;
        request.approvedAt = new Date();
        await request.save();

        await logAudit({
            userId: req.user._id,
            action: 'APPROVE',
            resource: 'LocationRequest',
            resourceId: request._id,
            description: 'Approved location request',
            req,
        });

        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/location-requests/:id/reject
// @desc    Reject location request
// @access  Private (Admin)
router.post('/:id/reject', protect, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const request = await LocationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Location request not found' });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending requests can be rejected' });
        }

        request.status = 'Rejected';
        request.rejectionReason = reason;
        request.approvedBy = req.user._id;
        request.approvedAt = new Date();
        await request.save();

        await logAudit({
            userId: req.user._id,
            action: 'REJECT',
            resource: 'LocationRequest',
            resourceId: request._id,
            description: 'Rejected location request',
            req,
        });

        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
