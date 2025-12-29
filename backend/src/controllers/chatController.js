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

        if (!name || !memberIds || memberIds.length < 2) {
            return res.status(400).json({
                message: 'Group name and at least 2 members are required'
            });
        }

        // Add current user to members and admins
        const members = [...new Set([req.user._id.toString(), ...memberIds])];

        const room = await ChatRoom.create({
            name,
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
        const rooms = await ChatRoom.find({
            members: req.user._id,
            isActive: true,
        })
            .populate('members', 'email staffRef')
            .populate({
                path: 'members',
                populate: { path: 'staffRef', select: 'name position' }
            })
            .populate('lastMessage')
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .lean(); // Use lean() to get plain JavaScript objects we can modify

        // Get unread counts for these rooms
        const roomIds = rooms.map(room => room._id);

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    roomId: { $in: roomIds },
                    senderId: { $ne: req.user._id }, // Incoming messages only
                    'readBy.userId': { $ne: req.user._id }, // Not read by current user
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
            id: room._id, // Ensure 'id' is present as per spec (optional but good practice)
            unreadCount: unreadMap[room._id.toString()] || 0,
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
        // We only update messages where the user is NOT the sender and hasn't read it yet
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
