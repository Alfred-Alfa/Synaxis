import express from 'express';
import {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} from '../controllers/announcementController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin, isSuperAdmin } from '../middleware/rbac.js';

const router = express.Router();

// Publicly available to all logged-in users
router.route('/').get(protect, getAnnouncements);
router.route('/:id').get(protect, getAnnouncementById);

// Admin/SuperAdmin only routes
router.post('/', protect, isAdmin, createAnnouncement);
router.put('/:id', protect, isAdmin, updateAnnouncement);
router.delete('/:id', protect, isAdmin, deleteAnnouncement);

export default router;
