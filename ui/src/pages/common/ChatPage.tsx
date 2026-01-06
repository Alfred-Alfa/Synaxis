import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Bell, BellOff, Volume2, VolumeX, X, Plus, Search, CheckCheck } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import {
    getEmployees,
    getUserRooms,
    getOrCreateDirectRoom,
    getRoomMessages,
    createGroupRoom,
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
} from '../../services/chatService';
import type {
    Employee,
    ChatRoom,
    Message,
} from '../../services/chatService';
import { UserAvatar } from '../../components/chat/UserAvatar';
import { ChatActions } from '../../components/chat/ChatActions';
import { ConfirmDialog } from '../../components/chat/ConfirmDialog';
import {
    formatChatTimestamp,
    truncateMessage,
    matchesSearch,
    getPresenceText,
} from '../../utils/chatHelpers';
import './ChatPage.css';

/**
 * Chat Page Component
 * Isolated chat module with real-time messaging and notifications
 */

export const ChatPage: React.FC = () => {
    const {
        socket,
        isConnected,
        activeRoom,
        setActiveRoom,
        unreadCount,
        refreshUnreadCount,
        isSoundMuted,
        toggleSoundMute,
        notificationPermission,
        requestNotificationPermission,
        onlineUsers, // Phase 3: Presence tracking
    } = useChat();

    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageText, setMessageText] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showEmployeeList, setShowEmployeeList] = useState(false);
    const [showGroupCreate, setShowGroupCreate] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    // NEW: Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');

    // NEW: Chat actions confirmation dialogs
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [actionRoomId, setActionRoomId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const currentUserStr = localStorage.getItem('hrms_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    /**
     * Load rooms on mount
     */
    useEffect(() => {
        loadRooms();
    }, []);

    /**
     * Load employees for new chat
     */
    useEffect(() => {
        if (showEmployeeList || showGroupCreate) {
            loadEmployees();
        }
    }, [showEmployeeList, showGroupCreate]);

    /**
     * Auto-scroll when messages change
     */
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * WebSocket event listeners
     */
    useEffect(() => {
        if (!socket || !activeRoom) return;

        const handleReceiveMessage = ({ message, roomId }: { message: Message; roomId: string }) => {
            // Always refresh rooms to update sidebar preview and timestamp
            loadRooms();

            if (roomId === activeRoom) {
                setMessages(prev => {
                    // 1. Prevent exact ID duplicates
                    if (prev.some(m => m._id === message._id)) return prev;

                    // 2. Handle Optimistic Updates: Replace temp message with real one
                    const tempMatchIndex = prev.findIndex(m =>
                        m._id.startsWith('temp-') &&
                        m.messageText === message.messageText &&
                        // Robust ID comparison for sender
                        String(typeof m.senderId === 'object' ? (m.senderId as any)._id : m.senderId) ===
                        String(typeof message.senderId === 'object' ? (message.senderId as any)._id : message.senderId)
                    );

                    if (tempMatchIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[tempMatchIndex] = message;
                        return newMessages;
                    }

                    return [...prev, message];
                });

                // Mark as read
                if (message.senderId !== currentUser?._id) {
                    socket.emit('mark_as_read', {
                        roomId: activeRoom,
                        messageIds: [message._id],
                    });
                    refreshUnreadCount();
                }
            }
        };

        const handleUserTyping = ({ userId }: { userId: string }) => {
            setTypingUsers(prev => new Set(prev).add(userId));
        };

        const handleUserStopTyping = ({ userId }: { userId: string }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
        };
    }, [socket, activeRoom, currentUser, refreshUnreadCount]);

    /**
     * Load chat rooms
     */
    const loadRooms = async () => {
        try {
            const data = await getUserRooms();
            setRooms(data);
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    };

    /**
     * Load employees
     */
    const loadEmployees = async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
    };

    /**
     * Load messages for a room
     */
    const loadMessages = async (roomId: string) => {
        try {
            setIsLoading(true);
            const data = await getRoomMessages(roomId);
            setMessages(data);

            // Mark all messages as read
            const unreadMessageIds = data
                .filter(msg => msg.senderId !== currentUser?._id)
                .filter(msg => !msg.readBy.some(r => r.userId === currentUser?._id))
                .map(msg => msg._id);

            if (unreadMessageIds.length > 0 && socket) {
                socket.emit('mark_as_read', {
                    roomId,
                    messageIds: unreadMessageIds,
                });
                refreshUnreadCount();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Open a chat room
     */
    const openRoom = (room: ChatRoom) => {
        setCurrentRoom(room);
        setActiveRoom(room._id);
        loadMessages(room._id);

        if (socket) {
            socket.emit('join_room', { roomId: room._id });
        }
    };

    /**
     * Create or open direct chat
     */
    const handleSelectEmployee = async (employeeId: string) => {
        try {
            setIsLoading(true);
            const room = await getOrCreateDirectRoom(employeeId);
            setShowEmployeeList(false);
            await loadRooms();
            openRoom(room);
        } catch (error) {
            console.error('Failed to create/open direct chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Create group chat
     */
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedEmployees.length < 1) {
            alert('Please enter a group name and select at least 2 members');
            return;
        }

        try {
            setIsLoading(true);
            const room = await createGroupRoom(groupName, selectedEmployees);
            setShowGroupCreate(false);
            setGroupName('');
            setSelectedEmployees([]);
            await loadRooms();
            openRoom(room);
        } catch (error) {
            console.error('Failed to create group chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Chat Action Handlers
     */
    const handleArchive = async (room: ChatRoom) => {
        try {
            const isArchived = (room as any).isArchived;
            if (isArchived) {
                await unarchiveRoom(room._id);
            } else {
                await archiveRoom(room._id);
            }
            await loadRooms();
        } catch (error) {
            console.error('Archive error:', error);
        }
    };

    const handlePin = async (room: ChatRoom) => {
        try {
            const isPinned = (room as any).isPinned;
            if (isPinned) {
                await unpinRoom(room._id);
            } else {
                await pinRoom(room._id);
            }
            await loadRooms();
        } catch (error) {
            console.error('Pin error:', error);
        }
    };

    const handleMute = async (room: ChatRoom) => {
        try {
            const isMuted = (room as any).isMuted;
            if (isMuted) {
                await unmuteRoom(room._id);
            } else {
                await muteRoom(room._id);
            }
            await loadRooms();
        } catch (error) {
            console.error('Mute error:', error);
        }
    };

    const handleDelete = (roomId: string) => {
        setActionRoomId(roomId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!actionRoomId) return;
        try {
            await deleteRoom(actionRoomId);
            await loadRooms();
            // Close chat if currently viewing deleted room
            if (activeRoom === actionRoomId) {
                setCurrentRoom(null);
                setActiveRoom(null);
            }
            setShowDeleteConfirm(false);
            setActionRoomId(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleClear = (roomId: string) => {
        setActionRoomId(roomId);
        setShowClearConfirm(true);
    };

    const confirmClear = async () => {
        if (!actionRoomId) return;
        try {
            await clearRoomHistory(actionRoomId);
            // Reload messages if currently viewing this room
            if (activeRoom === actionRoomId) {
                await openRoom(rooms.find(r => r._id === actionRoomId)!);
            }
            setShowClearConfirm(false);
            setActionRoomId(null);
        } catch (error) {
            console.error('Clear error:', error);
        }
    };

    const handleLeave = (roomId: string) => {
        setActionRoomId(roomId);
        setShowLeaveConfirm(true);
    };

    const confirmLeave = async () => {
        if (!actionRoomId) return;
        try {
            await leaveGroup(actionRoomId);
            await loadRooms();
            // Close chat if currently viewing left group
            if (activeRoom === actionRoomId) {
                setCurrentRoom(null);
                setActiveRoom(null);
            }
            setShowLeaveConfirm(false);
            setActionRoomId(null);
        } catch (error) {
            console.error('Leave error:', error);
        }
    };

    /**
     * Send message
     */
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageText.trim() || !socket || !activeRoom || !currentUser) return;

        const text = messageText.trim();

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            _id: tempId,
            roomId: activeRoom,
            senderId: currentUser._id || currentUser.id,
            senderName: currentUser.name || currentUser.username || currentUser.email || 'Me',
            messageText: text,
            messageType: 'text',
            readBy: [],
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setMessages(prev => [...prev, optimisticMessage]);

        socket.emit('send_message', {
            roomId: activeRoom,
            messageText: text,
        });

        setMessageText('');

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            socket.emit('stop_typing', { roomId: activeRoom });
        }
    };

    /**
     * Handle typing
     */
    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageText(e.target.value);

        if (!socket || !activeRoom) return;

        socket.emit('typing', { roomId: activeRoom });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { roomId: activeRoom });
        }, 1000);
    };

    /**
     * Get room display name
     */
    const getRoomDisplayName = (room: ChatRoom): string => {
        if (room.type === 'group') {
            return room.name || 'Unnamed Group';
        }

        // Handle case where currentUser might be null or undefined
        if (!currentUser) return 'Loading...';

        // Robust ID comparison: Convert both to string to ensure matching
        // currentUser can have ._id or .id depending on how it was saved
        const currentUserId = (currentUser._id || currentUser.id || '').toString();

        const otherMember = room.members.find((m: any) => {
            const memberId = (m._id || m.id).toString();
            return memberId !== currentUserId;
        });

        // Fallback: If no other member found (e.g. self-chat or bug), try to show the first member that isn't me, or just the first member name
        if (!otherMember) {
            // If members array is populated with objects, try to find one that doesn't match current ID string
            const fallback = room.members.find((m: any) => String(m._id || m.id) !== currentUserId);
            return fallback?.staffRef?.name || fallback?.email || 'Unknown User';
        }

        return otherMember?.staffRef?.name || otherMember?.email || 'Unknown User';
    };

    /**
     * Get message preview
     */
    const getMessagePreview = (room: ChatRoom): string => {
        if (!room.lastMessage) return 'No messages yet';
        const msg = room.lastMessage as any;
        return msg.messageText?.substring(0, 50) || '';
    };

    return (
        <div className="chat-page">
            <div className="chat-header">
                <div className="header-left">
                    <MessageCircle size={24} />
                    <span className="header-title">Chat</span>
                    {!isConnected && <span className="connection-status">Connecting...</span>}
                </div>
                <div className="header-right">
                    <button
                        className="icon-button"
                        onClick={toggleSoundMute}
                        title={isSoundMuted ? 'Unmute sound' : 'Mute sound'}
                    >
                        {isSoundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button
                        className="icon-button"
                        onClick={requestNotificationPermission}
                        title="Enable notifications"
                        disabled={notificationPermission === 'granted'}
                    >
                        {notificationPermission === 'granted' ? (
                            <Bell size={20} />
                        ) : (
                            <BellOff size={20} />
                        )}
                    </button>
                </div>
            </div>

            <div className="chat-container">
                {/* Sidebar */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <button
                            className="new-chat-button"
                            onClick={() => setShowEmployeeList(true)}
                        >
                            <Plus size={18} />
                            New Chat
                        </button>
                        <button
                            className="new-group-button"
                            onClick={() => setShowGroupCreate(true)}
                        >
                            <Users size={18} />
                            New Group
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="search-container" style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ position: 'relative' }}>
                            <Search
                                size={16}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }}
                            />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="filter-buttons" style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderBottom: '1px solid #e5e7eb',
                        overflowX: 'auto'
                    }}>
                        {(['all', 'unread', 'groups'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: filter === f ? '#3b82f6' : '#f3f4f6',
                                    color: filter === f ? 'white' : '#6b7280',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Rooms List */}
                    <div className="rooms-list" style={{ flex: 1, overflowY: 'auto' }}>
                        {rooms
                            .filter(room => {
                                // Search filter
                                const roomName = getRoomDisplayName(room);
                                if (!matchesSearch(roomName, searchQuery)) return false;

                                // Type filter
                                if (filter === 'groups' && room.type !== 'group') return false;
                                if (filter === 'unread' && !(unreadCount.unreadByRoom[room._id] > 0)) return false;

                                return true;
                            })
                            .map(room => {
                                const displayName = getRoomDisplayName(room);
                                const lastMsg = room.lastMessage as any;
                                const timestamp = lastMsg?.createdAt;
                                const isTyping = room.members.some((m: any) => typingUsers.has(m._id) && m._id !== currentUser?._id);

                                return (
                                    <div
                                        key={room._id}
                                        className={`room-item ${activeRoom === room._id ? 'active' : ''}`}
                                        onClick={() => openRoom(room)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f3f4f6',
                                            background: activeRoom === room._id ? '#eff6ff' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeRoom !== room._id) {
                                                e.currentTarget.style.background = '#f9fafb';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeRoom !== room._id) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        {/* Avatar */}
                                        <UserAvatar
                                            userId={room._id}
                                            name={displayName}
                                            size="medium"
                                            showOnline={room.type !== 'group'}
                                            status={status}
                                        />

                                        {/* Room Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '4px'
                                            }}>
                                                <div style={{
                                                    fontWeight: '500',
                                                    fontSize: '14px',
                                                    color: '#111827',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {displayName}
                                                </div>
                                                {timestamp && (
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#9ca3af',
                                                        flexShrink: 0,
                                                        marginLeft: '8px'
                                                    }}>
                                                        {formatChatTimestamp(timestamp)}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{
                                                fontSize: '12px',
                                                color: isTyping ? '#10b981' : '#6b7280',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontWeight: isTyping ? 500 : 400
                                            }}>
                                                {isTyping ? 'Typing...' : truncateMessage(getMessagePreview(room))}
                                            </div>
                                        </div>

                                        {/* Unread Badge */}
                                        {unreadCount.unreadByRoom[room._id] > 0 && (
                                            <div style={{
                                                minWidth: '20px',
                                                height: '20px',
                                                borderRadius: '10px',
                                                background: '#3b82f6',
                                                color: 'white',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 6px',
                                                marginRight: '8px'
                                            }}>
                                                {unreadCount.unreadByRoom[room._id] > 99
                                                    ? '99+'
                                                    : unreadCount.unreadByRoom[room._id]}
                                            </div>
                                        )}

                                        {/* Chat Actions Menu */}
                                        <ChatActions
                                            roomId={room._id}
                                            roomType={room.type}
                                            isArchived={(room as any).isArchived || false}
                                            isPinned={(room as any).isPinned || false}
                                            isMuted={(room as any).isMuted || false}
                                            onArchive={() => handleArchive(room)}
                                            onPin={() => handlePin(room)}
                                            onMute={() => handleMute(room)}
                                            onDelete={() => handleDelete(room._id)}
                                            onClear={() => handleClear(room._id)}
                                            onLeave={room.type === 'group' ? () => handleLeave(room._id) : undefined}
                                        />
                                    </div>
                                );
                            })}

                        {/* Empty State */}
                        {rooms.filter(room => {
                            const roomName = getRoomDisplayName(room);
                            if (!matchesSearch(roomName, searchQuery)) return false;
                            if (filter === 'groups' && room.type !== 'group') return false;
                            if (filter === 'unread' && !(unreadCount.unreadByRoom[room._id] > 0)) return false;
                            return true;
                        }).length === 0 && (
                                <div style={{
                                    padding: '3rem 1rem',
                                    textAlign: 'center',
                                    color: '#6b7280'
                                }}>
                                    <MessageCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                    <p style={{ fontSize: '14px', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        {searchQuery ? 'No chats found' : filter !== 'all' ? `No ${filter} chats` : 'No chats yet'}
                                    </p>
                                    <p style={{ fontSize: '12px', marginBottom: '1rem', color: '#9ca3af' }}>
                                        {searchQuery ? 'Try a different search term' : 'Start a conversation to get started'}
                                    </p>
                                    {!searchQuery && (
                                        <button
                                            onClick={() => setShowEmployeeList(true)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                                        >
                                            <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            Start New Chat
                                        </button>
                                    )}
                                </div>
                            )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-main">
                    {currentRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className="chat-room-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <UserAvatar
                                        userId={currentRoom._id}
                                        name={getRoomDisplayName(currentRoom)}
                                        size="medium"
                                        showOnline={currentRoom.type !== 'group'}
                                        status={currentRoom.type !== 'group' ?
                                            onlineUsers[currentRoom.members.find((m: any) => m._id !== currentUser?._id)?._id]?.status
                                            : undefined}
                                    />
                                    <div>
                                        <div className="room-title">{getRoomDisplayName(currentRoom)}</div>
                                        {currentRoom.type === 'group' ? (
                                            <div className="room-members" style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {(() => {
                                                    const typingMembers = currentRoom.members.filter((m: any) =>
                                                        typingUsers.has(m._id) && m._id !== currentUser?._id
                                                    );

                                                    if (typingMembers.length > 0) {
                                                        const names = typingMembers.map((m: any) => m.name || m.staffRef?.name || 'Someone').join(', ');
                                                        return <span style={{ color: '#10b981', fontWeight: 500 }}>
                                                            {typingMembers.length > 2 ? 'Several people are typing...' : `${names} is typing...`}
                                                        </span>;
                                                    }

                                                    return `${currentRoom.members.length} members`;
                                                })()}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {(() => {
                                                    const other = currentRoom.members.find((m: any) => m._id !== currentUser?._id);
                                                    if (!other) return 'Offline';

                                                    if (typingUsers.has(other._id)) {
                                                        return <span style={{ color: '#10b981', fontWeight: 500 }}>Typing...</span>;
                                                    }

                                                    const status = onlineUsers[other._id]?.status || 'offline';
                                                    return getPresenceText(status, onlineUsers[other._id]?.lastSeen);
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="messages-container">
                                {isLoading ? (
                                    <div style={{ padding: '20px' }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-start' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6' }}></div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ height: 12, width: '30%', background: '#f3f4f6', marginBottom: 8, borderRadius: 4 }}></div>
                                                    <div style={{ height: 32, width: '70%', background: '#f3f4f6', borderRadius: 8 }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {messages.map(msg => {
                                            // Robust ID comparison
                                            const msgSenderId = typeof msg.senderId === 'object'
                                                ? (msg.senderId as any)._id
                                                : msg.senderId;
                                            const currentUserId = currentUser?._id || currentUser?.id;
                                            const isOwnMessage = String(msgSenderId) === String(currentUserId);

                                            return (
                                                <div
                                                    key={msg._id}
                                                    className={`message ${isOwnMessage ? 'own' : 'other'}`}
                                                    style={{
                                                        display: 'flex',
                                                        gap: '8px',
                                                        marginBottom: '12px',
                                                        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                                                        alignItems: 'flex-end'
                                                    }}
                                                >
                                                    {!isOwnMessage && currentRoom?.type === 'group' && (
                                                        <UserAvatar
                                                            userId={typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId as any)._id}
                                                            name={msg.senderName}
                                                            size="small"
                                                        />
                                                    )}

                                                    <div className="message-content">
                                                        {!isOwnMessage && currentRoom?.type === 'group' && (
                                                            <div className="message-sender">
                                                                {msg.senderName}
                                                            </div>
                                                        )}
                                                        <div className="message-text">{msg.messageText}</div>
                                                        <div className="message-time">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                            {isOwnMessage && (
                                                                <span style={{ marginLeft: '4px', display: 'inline-flex', alignItems: 'center' }}>
                                                                    <CheckCheck
                                                                        size={14}
                                                                        color={msg.readBy && msg.readBy.length > 1 ? '#3b82f6' : '#9ca3af'}
                                                                    />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {typingUsers.size > 0 && (
                                            <div className="typing-indicator">Someone is typing...</div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Input */}
                            <form className="message-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="message-input"
                                    placeholder="Type a message..."
                                    value={messageText}
                                    onChange={handleTyping}
                                    disabled={!isConnected}
                                />
                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={!messageText.trim() || !isConnected}
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <MessageCircle size={64} />
                            <p>Select a chat to start messaging</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Employee List Modal */}
            {showEmployeeList && (
                <div className="modal-overlay" onClick={() => setShowEmployeeList(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Select Employee</h3>
                            <button className="close-button" onClick={() => setShowEmployeeList(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="employee-list">
                            {employees.map(emp => (
                                <div
                                    key={emp._id}
                                    className="employee-item"
                                    onClick={() => handleSelectEmployee(emp._id)}
                                >
                                    <div className="employee-name">{emp.name}</div>
                                    <div className="employee-position">{emp.position}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Group Create Modal */}
            {showGroupCreate && (
                <div className="modal-overlay" onClick={() => setShowGroupCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Group Chat</h3>
                            <button className="close-button" onClick={() => setShowGroupCreate(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="group-form" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>
                                <input
                                    type="text"
                                    className="group-name-input"
                                    placeholder="Group name"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                                    Select at least 1 member to create a group.
                                </p>
                            </div>

                            <div className="employee-list" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                {employees.map(emp => (
                                    <div
                                        key={emp._id}
                                        className={`employee-item selectable ${selectedEmployees.includes(emp._id) ? 'selected' : ''
                                            }`}
                                        onClick={() => {
                                            setSelectedEmployees(prev =>
                                                prev.includes(emp._id)
                                                    ? prev.filter(id => id !== emp._id)
                                                    : [...prev, emp._id]
                                            );
                                        }}
                                    >
                                        <div className="employee-name">{emp.name}</div>
                                        <div className="employee-position">{emp.position}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color, #e0e0e0)', background: '#f9f9f9', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                                <button
                                    className="create-group-button"
                                    onClick={handleCreateGroup}
                                    disabled={!groupName.trim() || selectedEmployees.length < 1}
                                    style={{ width: '100%' }}
                                >
                                    Create Group ({selectedEmployees.length} selected)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Chat?"
                message="This will remove the chat from your list. You won't see any new messages until someone messages you again."
                confirmText="Delete"
                cancelText="Cancel"
                danger={true}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <ConfirmDialog
                isOpen={showClearConfirm}
                title="Clear Chat History?"
                message="All messages will be cleared from your view. Other participants will still see them."
                confirmText="Clear"
                cancelText="Cancel"
                danger={true}
                onConfirm={confirmClear}
                onCancel={() => setShowClearConfirm(false)}
            />

            <ConfirmDialog
                isOpen={showLeaveConfirm}
                title="Leave Group?"
                message="You will be removed from this group and won't receive new messages. You'll need to be re-added to rejoin."
                confirmText="Leave"
                cancelText="Cancel"
                danger={true}
                onConfirm={confirmLeave}
                onCancel={() => setShowLeaveConfirm(false)}
            />
        </div>
    );
};
