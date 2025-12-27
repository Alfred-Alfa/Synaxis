import api from './api';

/**
 * Chat API Service
 * Isolated chat module - handles all chat-related API calls
 */

export interface Employee {
    _id: string;
    email: string;
    name: string;
    position: string;
    role: string;
}

export interface ChatRoom {
    _id: string;
    name?: string;
    type: 'direct' | 'group';
    members: any[];
    admins?: any[];
    lastMessage?: any;
    lastMessageAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    _id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    messageText: string;
    messageType: 'text' | 'system';
    readBy: Array<{ userId: string; readAt: Date }>;
    isDeleted: boolean;
    attachments?: Array<{
        url: string;
        name: string;
        type: string;
        size: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface UnreadCount {
    totalUnread: number;
    unreadByRoom: Record<string, number>;
}

/**
 * Get all employees for chat
 */
export const getEmployees = async (): Promise<Employee[]> => {
    const response = await api.get('/chat/employees');
    return response.data;
};

/**
 * Get or create a direct chat room
 */
export const getOrCreateDirectRoom = async (otherUserId: string): Promise<ChatRoom> => {
    const response = await api.post('/chat/rooms/direct', { otherUserId });
    return response.data;
};

/**
 * Create a group chat room
 */
export const createGroupRoom = async (name: string, memberIds: string[]): Promise<ChatRoom> => {
    const response = await api.post('/chat/rooms/group', { name, memberIds });
    return response.data;
};

/**
 * Get all chat rooms for current user
 */
export const getUserRooms = async (): Promise<ChatRoom[]> => {
    const response = await api.get('/chat/rooms');
    return response.data;
};

/**
 * Get messages for a chat room
 */
export const getRoomMessages = async (
    roomId: string,
    limit: number = 50,
    before?: string
): Promise<Message[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);

    const response = await api.get(`/chat/rooms/${roomId}/messages?${params}`);
    return response.data;
};

/**
 * Send a message
 */
export const sendMessage = async (roomId: string, messageText: string): Promise<Message> => {
    const response = await api.post(`/chat/rooms/${roomId}/messages`, { messageText });
    return response.data;
};

/**
 * Mark messages as read
 */
export const markAsRead = async (roomId: string, messageIds: string[]): Promise<void> => {
    await api.put(`/chat/rooms/${roomId}/read`, { messageIds });
};

// File attachment interface
export interface Attachment {
    url: string;
    name: string;
    type: string;
    size: number;
}

/**
 * Upload a file for chat
 */
export const uploadChatFile = async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/chat/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getUnreadCount = async (): Promise<UnreadCount> => {
    const response = await api.get('/chat/unread-count');
    return response.data;
};
