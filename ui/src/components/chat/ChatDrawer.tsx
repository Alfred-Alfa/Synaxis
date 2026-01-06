import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronLeft, MessageSquare, Loader2 } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import {
    getUserRooms,
    getRoomMessages,
    sendMessage,
    markAsRead,
} from '../../services/chatService';
import type {
    ChatRoom,
    Message,
} from '../../services/chatService';
import { UserAvatar } from './UserAvatar';
import { formatChatTimestamp, truncateMessage } from '../../utils/chatHelpers';
import './ChatDrawer.css';

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
    const { socket, unreadCount, refreshUnreadCount, setActiveRoom, onlineUsers } = useChat();

    // Local State
    const [view, setView] = useState<'LIST' | 'ROOM'>('LIST');
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUser = JSON.parse(localStorage.getItem('hrms_user') || '{}');

    // Load rooms when drawer opens
    useEffect(() => {
        if (isOpen) {
            loadRooms();
        }
    }, [isOpen, unreadCount]); // Reload if unread count changes to update list badges

    // Auto-scroll to bottom of messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, view]);

    // Handle incoming socket messages updates
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = ({ message, roomId }: { message: Message; roomId: string }) => {
            // Update message list if looking at this room
            if (view === 'ROOM' && currentRoom?._id === roomId) {
                setMessages(prev => [...prev, message]);

                // Mark as read immediately if drawer is open on this room
                if (isOpen && message.senderId !== currentUser._id) {
                    socket.emit('mark_as_read', {
                        roomId,
                        messageIds: [message._id],
                    });
                    refreshUnreadCount();
                }
            } else {
                // If in list view or another room, purely updating the room list is enough
                // as loadRooms will be triggered by unreadCount change or manual refresh
                loadRooms();
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, view, currentRoom, isOpen, currentUser._id, refreshUnreadCount]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadRooms = async () => {
        try {
            const data = await getUserRooms();
            setRooms(data);
        } catch (error) {
            console.error('Failed to load rooms inside drawer:', error);
        }
    };

    const handleRoomClick = async (room: ChatRoom) => {
        setIsLoading(true);
        setCurrentRoom(room);
        setActiveRoom(room._id); // Sync with global context
        setView('ROOM');

        try {
            const msgs = await getRoomMessages(room._id);
            setMessages(msgs);

            // Mark unread as read
            const unreadIds = msgs
                .filter(m => m.senderId !== currentUser._id)
                .filter(m => !m.readBy.some(r => r.userId === currentUser._id))
                .map(m => m._id);

            if (unreadIds.length > 0) {
                await markAsRead(room._id, unreadIds);
                refreshUnreadCount();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToList = () => {
        setView('LIST');
        setCurrentRoom(null);
        setActiveRoom(null);
        loadRooms(); // Refresh list to show potential new last messages
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !currentRoom) return;

        setIsSending(true);
        try {
            await sendMessage(currentRoom._id, messageText);
            setMessageText('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Helper: Get Display Name
    const getRoomName = (room: ChatRoom) => {
        if (room.type === 'group') return room.name || 'Group Chat';
        const other = room.members.find((m: any) => m._id !== currentUser._id);
        return other?.staffRef?.name || other?.email || 'Unknown User';
    };

    // Helper: formatting time
    const formatTime = (date?: Date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper: Get Room Status
    const getRoomStatus = (room: ChatRoom) => {
        if (room.type === 'group') {
            const onlineCount = room.members.filter((m: any) =>
                onlineUsers[m._id]?.status === 'online' || onlineUsers[m._id]?.status === 'away'
            ).length;
            return onlineCount > 0 ? `${onlineCount} online` : null;
        }

        const other = room.members.find((m: any) => m._id !== currentUser._id);
        if (!other) return 'offline';

        return onlineUsers[other._id]?.status || 'offline';
    };

    if (!isOpen) return null;

    return (
        <div className="chat-drawer">
            {/* Header */}
            <div className="drawer-header">
                <div className="drawer-title">
                    {view === 'ROOM' ? (
                        <>
                            <button onClick={handleBackToList} style={{ marginRight: '8px', color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <ChevronLeft size={20} />
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{currentRoom ? getRoomName(currentRoom) : 'Chat'}</span>
                                {currentRoom && (
                                    <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 'normal' }}>
                                        {currentRoom.type === 'group'
                                            ? getRoomStatus(currentRoom)
                                            : ((s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Offline')(getRoomStatus(currentRoom))}
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <MessageSquare size={18} />
                            <span>Messages</span>
                        </>
                    )}
                </div>
                <div className="drawer-actions">
                    <button onClick={onClose} title="Close">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="drawer-content">
                {view === 'LIST' ? (
                    <div className="mini-chat-list">
                        {rooms.length === 0 ? (
                            <div className="mini-empty-state">
                                <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <p>No conversations yet.</p>
                                <small style={{ color: '#9ca3af' }}>Start a new chat to get started</small>
                            </div>
                        ) : (
                            rooms.map(room => {
                                const unread = unreadCount.unreadByRoom[room._id] || 0;
                                const roomName = getRoomName(room);
                                const lastMsg = room.lastMessage as any;
                                const status = getRoomStatus(room);

                                return (
                                    <div
                                        key={room._id}
                                        className={`mini-chat-item ${unread > 0 ? 'unread' : ''}`}
                                        onClick={() => handleRoomClick(room)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f3f4f6',
                                            background: 'white',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        {/* Avatar with online indicator */}
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <UserAvatar
                                                userId={room._id}
                                                name={roomName}
                                                size="medium"
                                                showOnline={room.type !== 'group'}
                                                isOnline={status === 'online' || status === 'away'}
                                            />
                                        </div>

                                        {/* Chat Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '4px'
                                            }}>
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    fontWeight: unread > 0 ? '600' : '500',
                                                    color: '#111827',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {roomName}
                                                </h4>
                                                {lastMsg?.createdAt && (
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: '#9ca3af',
                                                        flexShrink: 0,
                                                        marginLeft: '8px'
                                                    }}>
                                                        {formatChatTimestamp(lastMsg.createdAt)}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '12px',
                                                    color: unread > 0 ? '#6b7280' : '#9ca3af',
                                                    fontWeight: unread > 0 ? '500' : 'normal',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    flex: 1
                                                }}>
                                                    {lastMsg?.messageText
                                                        ? truncateMessage(lastMsg.messageText, 40)
                                                        : 'No messages yet'}
                                                </p>

                                                {unread > 0 && (
                                                    <div style={{
                                                        minWidth: '18px',
                                                        height: '18px',
                                                        borderRadius: '9px',
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        fontSize: '10px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '0 5px',
                                                        marginLeft: '8px',
                                                        flexShrink: 0
                                                    }}>
                                                        {unread > 99 ? '99+' : unread}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    // ROOM VIEW
                    <>
                        <div className="mini-messages-area">
                            {isLoading ? (
                                <div className="mini-loading">
                                    <Loader2 className="animate-spin" />
                                    <span>Loading history...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="mini-empty-state">
                                    <p>No messages here yet.</p>
                                    <small>Say hello!</small>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isOwn = msg.senderId === currentUser._id ||
                                        (typeof msg.senderId === 'object' && (msg.senderId as any)._id === currentUser._id);
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`mini-message-bubble ${isOwn ? 'sent' : 'received'}`}
                                        >
                                            {msg.messageText ? msg.messageText : (msg.attachments && msg.attachments.length > 0 ? '📎 Attachment' : '')}
                                            <span className="mini-message-time">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="mini-chat-footer">
                            <form className="mini-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="mini-input"
                                    placeholder="Type a message..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="mini-send-btn"
                                    disabled={!messageText.trim() || isSending}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
