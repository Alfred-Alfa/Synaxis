import express from 'express';
import {
    getEmployees,
    getOrCreateDirectRoom,
    createGroupRoom,
    getUserRooms,
    getRoomMessages,
    sendMessage,
    markAsRead,
    markRoomAsRead,
    getUnreadCount,
    // Chat Actions
    archiveRoom,
    unarchiveRoom,
    pinRoom,
    unpinRoom,
    muteRoom,
    unmuteRoom,
    deleteRoom,
    clearRoomHistory,
    leaveGroup,
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
router.put('/rooms/:roomId/read', protect, markAsRead); // Batch mark specific messages
router.post('/rooms/:roomId/read', protect, markRoomAsRead); // Mark all in room

// Chat Management Actions
router.post('/rooms/:roomId/archive', protect, archiveRoom);
router.post('/rooms/:roomId/unarchive', protect, unarchiveRoom);
router.post('/rooms/:roomId/pin', protect, pinRoom);
router.post('/rooms/:roomId/unpin', protect, unpinRoom);
router.post('/rooms/:roomId/mute', protect, muteRoom);
router.post('/rooms/:roomId/unmute', protect, unmuteRoom);
router.delete('/rooms/:roomId', protect, deleteRoom); // Soft delete
router.post('/rooms/:roomId/clear-history', protect, clearRoomHistory);
router.post('/rooms/:roomId/leave', protect, leaveGroup); // Leave group chat

// Unread count
router.get('/unread-count', protect, getUnreadCount);

export default router;
