import express from 'express';
import TimeEntry from '../models/TimeEntry.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import upload from '../config/multer.js';
import logAudit from '../utils/auditLogger.js';
import { sendNotification, notifyAdmins } from '../utils/notification.js';
import Staff from '../models/Staff.js';
import LocationRequest from '../models/LocationRequest.js';

const router = express.Router();

// @route   GET /api/time-entries
// @desc    Get all time entries (Admin: all, Staff: own)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        // If staff or personal mode requested, only show their own entries
        if (req.user.role === 'Staff' || req.query.mode === 'personal') {
            query.staffId = req.user.staffRef;
        }

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            query.date = {};
            if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
            if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
        }

        const timeEntries = await TimeEntry.find(query)
            .populate('staffId', 'fullName email profilePhoto')
            .populate('siteId', 'name location')
            .populate('approvedBy', 'email')
            .sort({ date: -1 });

        res.json({
            success: true,
            count: timeEntries.length,
            data: timeEntries,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ... GET /:id route remains same ...

// @route   POST /api/time-entries
// @desc    Create time entry
// @access  Private (Staff)
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
    try {
        const {
            date,
            startTime,
            endTime,
            totalHours,
            siteId,
            jobDescription,
            ownTransport,
            travelDistance,
            travelAmount,
            travelNotes,
        } = req.body;

        const isAdminUser = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        // Admin can create entry for a specific staff member
        let targetStaffId = req.user.staffRef;
        if (isAdminUser && req.body.adminForStaffId) {
            const targetStaff = await Staff.findById(req.body.adminForStaffId);
            if (!targetStaff) {
                return res.status(400).json({ message: 'Staff member not found. Please select a valid staff member.' });
            }
            targetStaffId = req.body.adminForStaffId;
        }

        // Create time entry
        const timeEntry = await TimeEntry.create({
            staffId: targetStaffId,
            date,
            startTime,
            endTime,
            totalHours,
            siteId,
            jobDescription,
            ownTransport: ownTransport === 'true' || ownTransport === true,
            travelDetails: ownTransport ? {
                distance: travelDistance,
                amount: parseFloat(travelAmount) || 0,
                notes: travelNotes,
            } : undefined,
            attachments: req.files ? req.files.map(file => ({ path: file.path })) : [],
            status: isAdminUser ? 'Approved' : 'Pending',
            approvedBy: isAdminUser ? req.user._id : undefined,
            approvedAt: isAdminUser ? new Date() : undefined,
            approvalComment: isAdminUser ? 'Auto-approved for Admin' : undefined
        });

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'CREATE',
            resource: 'TimeEntry',
            resourceId: timeEntry._id,
            description: isAdminUser ? 'Submitted and auto-approved time entry' : 'Submitted time entry',
            newValue: timeEntry,
            req,
        });

        // Notify Admins only if not auto-approved
        if (!isAdminUser) {
            await notifyAdmins({
                title: 'New Time Entry',
                message: `New time entry submitted by user`,
                link: '/admin/time-entries',
                type: 'INFO',
            });
        }

        res.status(201).json({
            success: true,
            data: timeEntry,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/time-entries/:id
// @desc    Update time entry (only Pending entries)
// @access  Private (Staff - own entries only)
router.put('/:id', protect, async (req, res) => {
    try {
        const timeEntry = await TimeEntry.findById(req.params.id);

        if (!timeEntry) {
            return res.status(404).json({ message: 'Time entry not found' });
        }

        // Only owner can update
        if (timeEntry.staffId.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Can only update Pending entries
        if (timeEntry.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot update ${timeEntry.status} entries` });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== 'status' && key !== 'staffId') {
                timeEntry[key] = req.body[key];
            }
        });

        await timeEntry.save();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'TimeEntry',
            resourceId: timeEntry._id,
            description: 'Updated time entry',
            req,
        });

        res.json({
            success: true,
            data: timeEntry,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/time-entries/:id
// @desc    Delete time entry (only Pending entries)
// @access  Private (Staff - own entries only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const timeEntry = await TimeEntry.findById(req.params.id);

        if (!timeEntry) {
            return res.status(404).json({ message: 'Time entry not found' });
        }

        // Only owner can delete
        if (timeEntry.staffId.toString() !== req.user.staffRef.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Can only delete Pending entries
        if (timeEntry.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot delete ${timeEntry.status} entries` });
        }

        await timeEntry.deleteOne();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'DELETE',
            resource: 'TimeEntry',
            resourceId: timeEntry._id,
            description: 'Deleted time entry',
            req,
        });

        res.json({
            success: true,
            message: 'Time entry deleted',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/time-entries/:id/approve
// @desc    Approve time entry
// @access  Private (Admin only)
router.post('/:id/approve', protect, isAdmin, async (req, res) => {
    try {
        const timeEntry = await TimeEntry.findById(req.params.id);

        if (!timeEntry) {
            return res.status(404).json({ message: 'Time entry not found' });
        }

        if (timeEntry.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending entries can be approved' });
        }

        const { comment } = req.body;

        timeEntry.status = 'Approved';
        timeEntry.approvedBy = req.user._id;
        timeEntry.approvedAt = new Date();
        if (comment) timeEntry.approvalComment = comment;

        await timeEntry.save();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'APPROVE',
            resource: 'TimeEntry',
            resourceId: timeEntry._id,
            description: 'Approved time entry',
            req,
        });

        // Notify Staff
        await sendNotification({
            staffId: timeEntry.staffId,
            title: 'Time Entry Approved',
            message: `Your time entry for ${new Date(timeEntry.date).toLocaleDateString()} has been approved.${comment ? ` Remark: ${comment}` : ''}`,
            type: 'SUCCESS',
            link: '/staff/time-entries',
        });

        res.json({
            success: true,
            data: timeEntry,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/time-entries/:id/reject
// @desc    Reject time entry
// @access  Private (Admin only)
router.post('/:id/reject', protect, isAdmin, async (req, res) => {
    try {
        const { reason, comment } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const timeEntry = await TimeEntry.findById(req.params.id);

        if (!timeEntry) {
            return res.status(404).json({ message: 'Time entry not found' });
        }

        if (timeEntry.status !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending entries can be rejected' });
        }

        timeEntry.status = 'Rejected';
        timeEntry.rejectionReason = reason;
        timeEntry.rejectionComment = comment;
        timeEntry.approvedBy = req.user._id;
        timeEntry.approvedAt = new Date();

        await timeEntry.save();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'REJECT',
            resource: 'TimeEntry',
            resourceId: timeEntry._id,
            description: `Rejected time entry: ${reason}`,
            req,
        });

        // Notify Staff
        await sendNotification({
            staffId: timeEntry.staffId,
            title: 'Time Entry Rejected',
            message: `Your time entry for ${new Date(timeEntry.date).toLocaleDateString()} has been rejected. Reason: ${reason}`,
            type: 'ERROR',
            link: '/staff/time-entries',
        });

        res.json({
            success: true,
            data: timeEntry,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/time-entries/current/status
// @desc    Get current check-in status
// @access  Private (Staff only)
router.get('/current/status', protect, async (req, res) => {
    try {
        const activeEntry = await TimeEntry.findOne({
            staffId: req.user.staffRef,
            status: 'Active'
        })
            .populate('siteId', 'name location')
            .populate('locationRequestId', 'locationName');

        res.json({
            success: true,
            data: activeEntry || null,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

import Site from '../models/Site.js';

// Helper function to calculate distance in meters
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Distance in meters
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// @route   POST /api/time-entries/check-in
// @desc    Check in to a site or custom location with photo verification
// @access  Private (Staff only)
router.post('/check-in', protect, upload.single('photo'), async (req, res) => {
    try {
        const { siteId, locationMode, locationRequestId, latitude, longitude, deviceId, deviceName } = req.body;

        const mode = locationMode || 'site';

        // Verify Geofence based on mode
        let targetLat, targetLon, allowedRadius;

        const roleCheck = req.user.role;
        const isAdminUser = roleCheck === 'Admin' || roleCheck === 'SuperAdmin';

        // Admins bypass geofence; Staff must have GPS
        if (!isAdminUser) {
            if (!latitude || !longitude) {
                return res.status(400).json({ message: 'GPS location is required for check-in. Please enable location services and try again.' });
            }

            if (mode === 'home') {
                const staff = await Staff.findById(req.user.staffRef);
                if (!staff || !staff.homeLocation || !staff.homeLocation.coordinates || !staff.homeLocation.coordinates.latitude) {
                    return res.status(400).json({ message: 'Home location is not configured for your profile' });
                }
                targetLat = staff.homeLocation.coordinates.latitude;
                targetLon = staff.homeLocation.coordinates.longitude;
                allowedRadius = staff.homeLocation.radius || 150;
            } else if (mode === 'request') {
                if (!locationRequestId) {
                    return res.status(400).json({ message: 'Location request ID is required' });
                }
                const request = await LocationRequest.findById(locationRequestId);
                if (!request || request.staffId.toString() !== req.user.staffRef.toString() || request.status !== 'Approved') {
                    return res.status(400).json({ message: 'Invalid or unapproved location request' });
                }
                targetLat = request.coordinates.latitude;
                targetLon = request.coordinates.longitude;
                allowedRadius = request.radius || 150;
            } else {
                // Default site mode
                if (!siteId) {
                    return res.status(400).json({ message: 'Site ID is required for site check-in' });
                }
                const site = await Site.findById(siteId);
                if (!site) {
                    return res.status(400).json({ message: 'Site not found' });
                }
                if (!site.coordinates || !site.coordinates.latitude || !site.coordinates.longitude) {
                    return res.status(400).json({ message: `Site "${site.name}" does not have GPS coordinates configured. Please contact your admin.` });
                }
                targetLat = site.coordinates.latitude;
                targetLon = site.coordinates.longitude;
                allowedRadius = site.radius || 50;
            }

            const distance = getDistanceFromLatLonInM(
                parseFloat(latitude),
                parseFloat(longitude),
                targetLat,
                targetLon
            );

            if (distance > allowedRadius) {
                return res.status(400).json({
                    message: `You are ${Math.round(distance)}m away from the required location. You must be within ${allowedRadius}m to check in.`
                });
            }
        }


        // Check if already checked in
        const existingActive = await TimeEntry.findOne({
            staffId: req.user.staffRef,
            status: 'Active'
        });

        if (existingActive) {
            return res.status(400).json({ message: 'You are already checked in' });
        }

        const now = new Date();
        const startTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const timeEntry = await TimeEntry.create({
            staffId: req.user.staffRef,
            date: now,
            startTime,
            siteId: mode === 'site' ? siteId : undefined,
            locationMode: mode,
            locationRequestId: mode === 'request' ? locationRequestId : undefined,
            jobDescription: 'Checked In via Dashboard', // Default description
            status: 'Active',
            checkInLocation: (latitude && longitude) ? {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            } : undefined,
            checkInPhoto: req.file ? req.file.path : undefined,
            deviceId: deviceId, // Store device ID for verification
        });

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'CHECK_IN',
            resource: 'TimeEntry',
            resourceId: timeEntry._id,
            description: `Checked in at site`,
            req,
        });

        await timeEntry.populate('siteId', 'name location');
        await timeEntry.populate('locationRequestId', 'locationName');

        res.status(201).json({
            success: true,
            data: timeEntry,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/time-entries/check-out
// @desc    Check out from current site with photo verification
// @access  Private (Staff only)
router.post('/check-out', protect, upload.single('photo'), async (req, res) => {
    try {
        const { latitude, longitude } = req.body; // Extract location from checkout request

        const activeEntry = await TimeEntry.findOne({
            staffId: req.user.staffRef,
            status: 'Active'
        });

        if (!activeEntry) {
            return res.status(400).json({ message: 'No active check-in found' });
        }

        const now = new Date();
        const endTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        // Calculate hours
        // Use the original check-in timestamp (activeEntry.date) for calculation vs 'now'
        // This avoids any string parsing issues with startTime and ensures robustness.
        let diff = (now.getTime() - new Date(activeEntry.date).getTime()) / (1000 * 60 * 60); // Hours

        // Safety: ensure positive and not NaN
        if (isNaN(diff) || diff < 0) diff = 0;

        activeEntry.endTime = endTime;
        activeEntry.totalHours = parseFloat(diff.toFixed(2));
        activeEntry.status = 'Pending'; // Move to Pending for approval

        // Store checkout location
        if (latitude && longitude) {
            activeEntry.checkOutLocation = {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            };
        }

        // Store checkout photo
        if (req.file) {
            activeEntry.checkOutPhoto = req.file.path;
        }

        // Allow updating description on checkout if provided?
        if (req.body.jobDescription) {
            activeEntry.jobDescription = req.body.jobDescription;
        }

        await activeEntry.save();

        // Log audit
        await logAudit({
            userId: req.user._id,
            action: 'CHECK_OUT',
            resource: 'TimeEntry',
            resourceId: activeEntry._id,
            description: `Checked out. Total hours: ${activeEntry.totalHours}`,
            req,
        });

        // Notify Admins
        await notifyAdmins({
            title: 'New Time Entry',
            message: `User completed a shift (${activeEntry.totalHours} hrs)`,
            link: '/admin/time-entries',
            type: 'INFO',
        });

        res.json({
            success: true,
            data: activeEntry,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
