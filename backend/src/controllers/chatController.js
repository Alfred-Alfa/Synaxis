import mongoose from 'mongoose';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

/**
 * Chat Controller
 * Isolated chat module - does not modify existing HRMS functionality
 */

/**
 * @desc    Get all employees for chat (read-only access to User model)
 * @route   GET /api/chat/employees
 * @access  Private
 */
export const getEmployees = async (req, res) => {
    try {
        // Fetch all active users except the current user
        const employees = await User.find({
            _id: { $ne: req.user._id },
            isActive: true,
        })
            .select('email role staffRef')
            .populate('staffRef', 'name position');

        const formattedEmployees = employees.map(emp => ({
            _id: emp._id,
            email: emp.email,
            name: emp.staffRef?.name || emp.email,
            position: emp.staffRef?.position || emp.role,
            role: emp.role,
        }));

        res.json(formattedEmployees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Failed to fetch employees' });
    }
};

/**
 * @desc    Get or create a direct chat room
 * @route   POST /api/chat/rooms/direct
 * @access  Private
 */
export const getOrCreateDirectRoom = async (req, res) => {
    try {
        const { otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ message: 'Other user ID is required' });
        }

        // Check if direct room already exists
        let room = await ChatRoom.findOne({
            type: 'direct',
            members: { $all: [req.user._id, otherUserId], $size: 2 },
        })
            .populate('members', 'email staffRef')
            .populate({
                path: 'members',
                populate: { path: 'staffRef', select: 'name position' }
            })
            .populate('lastMessage');

        if (!room) {
            // Create new direct room
            room = await ChatRoom.create({
                type: 'direct',
                members: [req.user._id, otherUserId],
            });

            room = await ChatRoom.findById(room._id)
                .populate('members', 'email staffRef')
                .populate({
                    path: 'members',
                    populate: { path: 'staffRef', select: 'name position' }
                });
        }

        res.json(room);
    } catch (error) {
        console.error('Error creating/fetching direct room:', error);
        res.status(500).json({ message: 'Failed to create/fetch chat room' });
    }
};

/**
 * @desc    Create a group chat room
 * @route   POST /api/chat/rooms/group
 * @access  Private
 */
export const createGroupRoom = async (req, res) => {
    try {
        const { name, memberIds } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 1) {
            return res.status(400).json({
                message: 'Please select at least 1 other member'
            });
        }

        // Validate ObjectIds
        const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
        const validMemberIds = memberIds.filter(isValidObjectId);

        if (validMemberIds.length !== memberIds.length) {
            return res.status(400).json({ message: 'Invalid member IDs provided' });
        }

        // Add current user to members and admins
        const members = [...new Set([req.user._id.toString(), ...validMemberIds])];

        const room = await ChatRoom.create({
            name: name.trim(),
            type: 'group',
            members,
            admins: [req.user._id],
        });

        const populatedRoom = await ChatRoom.findById(room._id)
            .populate('members', 'email staffRef')
            .populate({
                path: 'members',
                populate: { path: 'staffRef', select: 'name position' }
            })
            .populate('admins', 'email staffRef');

        res.status(201).json(populatedRoom);
    } catch (error) {
        console.error('Error creating group room:', error);
        res.status(500).json({ message: 'Failed to create group chat' });
    }
};

/**
 * @desc    Get all chat rooms for current user with unread counts
 * @route   GET /api/chat/rooms
 * @access  Private
 */
export const getUserRooms = async (req, res) => {
    try {
        const userId = req.user._id;

        const rooms = await ChatRoom.find({
            members: userId,
            isActive: true,
            // Exclude rooms user has deleted
            'deletedBy.userId': { $ne: userId },
        })
            .populate('members', 'email staffRef')
            .populate({
                path: 'members',
                populate: { path: 'staffRef', select: 'name position' }
            })
            .populate('lastMessage')
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .lean();

        // Get unread counts for these rooms
        const roomIds = rooms.map(room => room._id);

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    roomId: { $in: roomIds },
                    senderId: { $ne: userId },
                    'readBy.userId': { $ne: userId },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: '$roomId',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Map counts to rooms
        const unreadMap = {};
        unreadCounts.forEach(item => {
            unreadMap[item._id.toString()] = item.count;
        });

        const roomsWithUnread = rooms.map(room => ({
            ...room,
            id: room._id,
            unreadCount: unreadMap[room._id.toString()] || 0,
            // Add user-specific flags
            isArchived: room.archivedBy?.some(id => id.toString() === userId.toString()) || false,
            isPinned: room.pinnedBy?.some(id => id.toString() === userId.toString()) || false,
            isMuted: room.mutedBy?.some(id => id.toString() === userId.toString()) || false,
        }));

        res.json(roomsWithUnread);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Failed to fetch chat rooms' });
    }
};

/**
 * @desc    Get messages for a chat room
 * @route   GET /api/chat/rooms/:roomId/messages
 * @access  Private
 */
export const getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 50, before } = req.query;

        // Verify user is member of the room
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        if (!room.isMember(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }

        // Build query
        const query = {
            roomId,
            isDeleted: false,
        };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('senderId', 'email staffRef')
            .populate({
                path: 'senderId',
                populate: { path: 'staffRef', select: 'name' }
            });

        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

/**
 * @desc    Send a message
 * @route   POST /api/chat/rooms/:roomId/messages
 * @access  Private
 */
export const sendMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { messageText } = req.body;

        if (!messageText || !messageText.trim()) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        // Verify user is member of the room
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        if (!room.isMember(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to send messages in this chat' });
        }

        // Get sender name from staffRef or email
        const user = await User.findById(req.user._id).populate('staffRef', 'name');
        const senderName = user.staffRef?.name || user.email;

        // Create message
        const message = await Message.create({
            roomId,
            senderId: req.user._id,
            senderName,
            messageText: messageText.trim(),
            readBy: [{ userId: req.user._id }],
        });

        // Update room's last message
        await ChatRoom.findByIdAndUpdate(roomId, {
            lastMessage: message._id,
            lastMessageAt: message.createdAt,
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'email staffRef')
            .populate({
                path: 'senderId',
                populate: { path: 'staffRef', select: 'name' }
            });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

/**
 * @desc    Mark specific messages as read (Batch)
 * @route   PUT /api/chat/rooms/:roomId/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { messageIds } = req.body;

        // Verify user is member of the room
        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update messages
        await Message.updateMany(
            {
                _id: { $in: messageIds },
                roomId,
                'readBy.userId': { $ne: req.user._id },
            },
            {
                $push: {
                    readBy: {
                        userId: req.user._id,
                        readAt: new Date(),
                    },
                },
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Failed to mark messages as read' });
    }
};

/**
 * @desc    Mark all messages in a room as read
 * @route   POST /api/chat/rooms/:roomId/read
 * @access  Private
 */
export const markRoomAsRead = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Verify user is member of the room
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        if (!room.isMember(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update all unread messages in this room for this user
        await Message.updateMany(
            {
                roomId: roomId,
                senderId: { $ne: req.user._id },
                'readBy.userId': { $ne: req.user._id },
            },
            {
                $push: {
                    readBy: {
                        userId: req.user._id,
                        readAt: new Date(),
                    },
                },
            }
        );

        res.json({ message: 'All messages in room marked as read' });
    } catch (error) {
        console.error('Error marking room as read:', error);
        res.status(500).json({ message: 'Failed to mark room as read' });
    }
};

/**
 * @desc    Get unread count for all rooms
 * @route   GET /api/chat/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
    try {
        // Get all rooms user is a member of
        const rooms = await ChatRoom.find({
            members: req.user._id,
            isActive: true,
        }).select('_id');

        const roomIds = rooms.map(r => r._id);

        // Count unread messages per room
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    roomId: { $in: roomIds },
                    senderId: { $ne: req.user._id },
                    'readBy.userId': { $ne: req.user._id },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: '$roomId',
                    count: { $sum: 1 },
                },
            },
        ]);

        const unreadByRoom = {};
        let totalUnread = 0;

        unreadCounts.forEach(item => {
            unreadByRoom[item._id.toString()] = item.count;
            totalUnread += item.count;
        });

        res.json({
            totalUnread,
            unreadByRoom,
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Failed to fetch unread count' });
    }
};

// ===== CHAT ACTION CONTROLLERS (PHASE 2) =====

/**
 * @desc    Archive a chat room
 * @route   POST /api/chat/rooms/:roomId/archive
 * @access  Private
 */
export const archiveRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Add user to archivedBy array if not already there
        await ChatRoom.findByIdAndUpdate(roomId, {
            $addToSet: { archivedBy: userId }
        });

        res.json({ message: 'Chat archived successfully' });
    } catch (error) {
        console.error('Error archiving room:', error);
        res.status(500).json({ message: 'Failed to archive chat' });
    }
};

/**
 * @desc    Unarchive a chat room
 * @route   POST /api/chat/rooms/:roomId/unarchive
 * @access  Private
 */
export const unarchiveRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Remove user from archivedBy array
        await ChatRoom.findByIdAndUpdate(roomId, {
            $pull: { archivedBy: userId }
        });

        res.json({ message: 'Chat unarchived successfully' });
    } catch (error) {
        console.error('Error unarchiving room:', error);
        res.status(500).json({ message: 'Failed to unarchive chat' });
    }
};

/**
 * @desc    Pin a chat room
 * @route   POST /api/chat/rooms/:roomId/pin
 * @access  Private
 */
export const pinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await ChatRoom.findByIdAndUpdate(roomId, {
            $addToSet: { pinnedBy: userId }
        });

        res.json({ message: 'Chat pinned successfully' });
    } catch (error) {
        console.error('Error pinning room:', error);
        res.status(500).json({ message: 'Failed to pin chat' });
    }
};

/**
 * @desc    Unpin a chat room
 * @route   POST /api/chat/rooms/:roomId/unpin
 * @access  Private
 */
export const unpinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await ChatRoom.findByIdAndUpdate(roomId, {
            $pull: { pinnedBy: userId }
        });

        res.json({ message: 'Chat unpinned successfully' });
    } catch (error) {
        console.error('Error unpinning room:', error);
        res.status(500).json({ message: 'Failed to unpin chat' });
    }
};

/**
 * @desc    Mute a chat room
 * @route   POST /api/chat/rooms/:roomId/mute
 * @access  Private
 */
export const muteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await ChatRoom.findByIdAndUpdate(roomId, {
            $addToSet: { mutedBy: userId }
        });

        res.json({ message: 'Chat muted successfully' });
    } catch (error) {
        console.error('Error muting room:', error);
        res.status(500).json({ message: 'Failed to mute chat' });
    }
};

/**
 * @desc    Unmute a chat room
 * @route   POST /api/chat/rooms/:roomId/unmute
 * @access  Private
 */
export const unmuteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await ChatRoom.findByIdAndUpdate(roomId, {
            $pull: { mutedBy: userId }
        });

        res.json({ message: 'Chat unmuted successfully' });
    } catch (error) {
        console.error('Error unmuting room:', error);
        res.status(500).json({ message: 'Failed to unmute chat' });
    }
};

/**
 * @desc    Soft delete a chat room for current user
 * @route   DELETE /api/chat/rooms/:roomId
 * @access  Private
 */
export const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Add user to deletedBy array (soft delete)
        await ChatRoom.findByIdAndUpdate(roomId, {
            $addToSet: {
                deletedBy: {
                    userId,
                    deletedAt: new Date()
                }
            }
        });

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: 'Failed to delete chat' });
    }
};

/**
 * @desc    Clear chat history for current user
 * @route   POST /api/chat/rooms/:roomId/clear-history
 * @access  Private
 */
export const clearRoomHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isMember(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Mark all messages as deleted for this user
        // Note: This doesn't actually delete messages, just marks them as deleted
        // for this specific user. Other users can still see them.
        await Message.updateMany(
            { roomId },
            {
                $addToSet: {
                    deletedFor: userId
                }
            }
        );

        res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({ message: 'Failed to clear chat history' });
    }
};

/**
 * @desc    Leave a group chat
 * @route   POST /api/chat/rooms/:roomId/leave
 * @access  Private
 */
export const leaveGroup = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        if (room.type !== 'group') {
            return res.status(400).json({ message: 'Can only leave group chats' });
        }

        if (!room.isMember(userId)) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        // Remove user from members and admins
        await ChatRoom.findByIdAndUpdate(roomId, {
            $pull: {
                members: userId,
                admins: userId
            }
        });

        // If no members left, deactivate the room
        const updatedRoom = await ChatRoom.findById(roomId);
        if (updatedRoom.members.length === 0) {
            updatedRoom.isActive = false;
            await updatedRoom.save();
        }

        // Create a system message
        await Message.create({
            roomId,
            senderId: userId,
            senderName: 'System',
            messageText: `${req.user.email} left the group`,
            isSystem: true,
            readBy: [{ userId }],
        });

        res.json({ message: 'Left group successfully' });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ message: 'Failed to leave group' });
    }
};
