import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';

/**
 * WebSocket Server for Real-time Chat
 * Isolated chat module - does not affect existing HRMS functionality
 * 
 * Events:
 * - connection: Client connects
 * - join_room: User joins a chat room
 * - leave_room: User leaves a chat room
 * - send_message: User sends a message
 * - receive_message: Broadcast message to room members
 * - typing: User is typing
 * - stop_typing: User stopped typing
 * - disconnect: Client disconnects
 */

let io;

// Store active users and their socket IDs
const activeUsers = new Map(); // userId -> Set of socketIds
const userSockets = new Map(); // socketId -> userId
const activeUsersStatus = new Map(); // userId -> 'online' | 'away'

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://localhost:5000',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:3000',
                'http://192.168.1.4:5173',
                'http://192.168.1.4:3000',
                'https://hrms.elitecraftuk.com'
            ],
            credentials: true,
        },
        path: '/socket.io/',
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user || !user.isActive) {
                return next(new Error('Authentication error: Invalid user'));
            }

            // Attach user to socket
            socket.userId = user._id.toString();
            socket.userEmail = user.email;

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`✓ Chat: User ${userId} connected (socket: ${socket.id})`);

        // Track active user
        if (!activeUsers.has(userId)) {
            activeUsers.set(userId, new Set());
        }
        activeUsers.get(userId).add(socket.id);
        userSockets.set(socket.id, userId);

        // Default status is online if not set
        if (!activeUsersStatus.has(userId)) {
            activeUsersStatus.set(userId, 'online');
        }

        // Update user presence in database
        User.findByIdAndUpdate(userId, {
            presenceStatus: 'online',
            lastSeen: new Date()
        }).catch(err => console.error('Error updating presence:', err));

        // Send all current user statuses to the new client
        socket.emit('initial_statuses', Array.from(activeUsersStatus.entries()));

        // Broadcast user online status
        socket.broadcast.emit('user_status_change', { userId, status: 'online' });

        /**
         * Join a chat room
         */
        socket.on('join_room', async ({ roomId }) => {
            try {
                // Verify user is member of the room
                const room = await ChatRoom.findById(roomId);
                if (!room || !room.isMember(userId)) {
                    socket.emit('error', { message: 'Not authorized to join this room' });
                    return;
                }

                socket.join(roomId);
                console.log(`User ${userId} joined room ${roomId}`);

                // Notify others in the room
                socket.to(roomId).emit('user_joined_room', {
                    roomId,
                    userId,
                });
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        /**
         * Update user status (online/away)
         */
        socket.on('update_status', ({ status }) => {
            if (['online', 'away'].includes(status)) {
                activeUsersStatus.set(userId, status);

                // Update in database
                User.findByIdAndUpdate(userId, {
                    presenceStatus: status,
                    lastSeen: new Date()
                }).catch(err => console.error('Error updating status:', err));

                // Broadcast to everyone
                io.emit('user_status_change', { userId, status });
            }
        });

        /**
         * Leave a chat room
         */
        socket.on('leave_room', ({ roomId }) => {
            socket.leave(roomId);
            console.log(`User ${userId} left room ${roomId}`);

            socket.to(roomId).emit('user_left_room', {
                roomId,
                userId,
            });
        });

        /**
         * Send a message
         */
        socket.on('send_message', async ({ roomId, messageText, attachments }) => {
            try {
                if ((!messageText || !messageText.trim()) && (!attachments || attachments.length === 0)) {
                    socket.emit('error', { message: 'Message text or attachment is required' });
                    return;
                }

                // Verify user is member of the room
                const room = await ChatRoom.findById(roomId);
                if (!room || !room.isMember(userId)) {
                    socket.emit('error', { message: 'Not authorized to send messages' });
                    return;
                }

                // Get sender details
                const user = await User.findById(userId).populate('staffRef', 'name');
                const senderName = user.staffRef?.name || user.email;

                // Create message
                const message = await Message.create({
                    roomId,
                    senderId: userId,
                    senderName,
                    messageText: messageText ? messageText.trim() : '',
                    attachments: attachments || [],
                    readBy: [{ userId }],
                });

                // Update room's last message
                await ChatRoom.findByIdAndUpdate(roomId, {
                    lastMessage: message._id,
                    lastMessageAt: message.createdAt,
                });

                // Populate message
                const populatedMessage = await Message.findById(message._id)
                    .populate('senderId', 'email staffRef')
                    .populate({
                        path: 'senderId',
                        populate: { path: 'staffRef', select: 'name' }
                    });

                // Broadcast to all room members (including sender for confirmation)
                io.to(roomId).emit('receive_message', {
                    message: populatedMessage,
                    roomId,
                });

                console.log(`Message sent in room ${roomId} by user ${userId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        /**
         * Typing indicator
         */
        socket.on('typing', ({ roomId }) => {
            socket.to(roomId).emit('user_typing', {
                roomId,
                userId,
            });
        });

        socket.on('stop_typing', ({ roomId }) => {
            socket.to(roomId).emit('user_stop_typing', {
                roomId,
                userId,
            });
        });

        /**
         * Mark messages as read
         */
        socket.on('mark_as_read', async ({ roomId, messageIds }) => {
            try {
                await Message.updateMany(
                    {
                        _id: { $in: messageIds },
                        roomId,
                        'readBy.userId': { $ne: userId },
                    },
                    {
                        $push: {
                            readBy: {
                                userId,
                                readAt: new Date(),
                            },
                        },
                    }
                );

                // Notify room members
                socket.to(roomId).emit('messages_read', {
                    roomId,
                    userId,
                    messageIds,
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        /**
         * Disconnect handler
         */
        socket.on('disconnect', () => {
            console.log(`✗ Chat: User ${userId} disconnected (socket: ${socket.id})`);

            // Remove from active users
            if (activeUsers.has(userId)) {
                activeUsers.get(userId).delete(socket.id);
                if (activeUsers.get(userId).size === 0) {
                    activeUsers.delete(userId);
                    activeUsersStatus.delete(userId);

                    // User is completely offline
                    const lastSeen = new Date();
                    io.emit('user_status_change', { userId, status: 'offline', lastSeen });

                    // Update lastSeen and presence status in DB
                    User.findByIdAndUpdate(userId, {
                        lastSeen,
                        presenceStatus: 'offline'
                    }).catch(err => {
                        console.error('Error updating lastSeen:', err);
                    });
                }
            }
            userSockets.delete(socket.id);
        });

        /**
         * Error handler
         */
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    console.log('✓ WebSocket server initialized for chat');
    return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

/**
 * Get active users
 */
export const getActiveUsers = () => {
    return Array.from(activeUsers.keys());
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
    return activeUsers.has(userId.toString());
};

/**
 * Get user status
 */
export const getUserStatus = (userId) => {
    return activeUsersStatus.get(userId.toString()) || 'offline';
};
