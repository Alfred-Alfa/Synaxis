import express from 'express';
import {
    getEmployees,
    getOrCreateDirectRoom,
    createGroupRoom,
    getUserRooms,
    getRoomMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * Chat Routes
 * All routes are protected and require authentication
 * Isolated chat module - does not affect existing HRMS routes
 */

// Employee discovery (read-only from existing User model)
router.get('/employees', protect, getEmployees);

// Chat rooms
router.post('/rooms/direct', protect, getOrCreateDirectRoom);
router.post('/rooms/group', protect, createGroupRoom);
router.get('/rooms', protect, getUserRooms);

// Messages
router.get('/rooms/:roomId/messages', protect, getRoomMessages);
router.post('/rooms/:roomId/messages', protect, sendMessage);
router.put('/rooms/:roomId/read', protect, markAsRead);

// Unread count
router.get('/unread-count', protect, getUnreadCount);

export default router;
