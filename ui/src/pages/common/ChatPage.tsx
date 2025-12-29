import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Bell, BellOff, Volume2, VolumeX, X, Plus } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import {
    getEmployees,
    getUserRooms,
    getOrCreateDirectRoom,
    getRoomMessages,
    createGroupRoom,
} from '../../services/chatService';
import type {
    Employee,
    ChatRoom,
    Message,
} from '../../services/chatService';
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
            if (roomId === activeRoom) {
                setMessages(prev => [...prev, message]);

                // Mark as read
                if (message.senderId !== currentUser?._id) {
                    socket.emit('mark_as_read', {
                        roomId: activeRoom,
                        messageIds: [message._id],
                    });
                    refreshUnreadCount();
                }
            } else {
                // Refresh rooms to update last message
                loadRooms();
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
     * Send message
     */
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageText.trim() || !socket || !activeRoom) return;

        socket.emit('send_message', {
            roomId: activeRoom,
            messageText: messageText.trim(),
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

                    <div className="rooms-list">
                        {rooms.map(room => (
                            <div
                                key={room._id}
                                className={`room-item ${activeRoom === room._id ? 'active' : ''}`}
                                onClick={() => openRoom(room)}
                            >
                                <div className="room-info">
                                    <div className="room-name">{getRoomDisplayName(room)}</div>
                                    <div className="room-preview">{getMessagePreview(room)}</div>
                                </div>
                                {unreadCount.unreadByRoom[room._id] > 0 && (
                                    <div className="unread-badge">
                                        {unreadCount.unreadByRoom[room._id]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-main">
                    {currentRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className="chat-room-header">
                                <div className="room-title">{getRoomDisplayName(currentRoom)}</div>
                                {currentRoom.type === 'group' && (
                                    <div className="room-members">
                                        {currentRoom.members.length} members
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="messages-container">
                                {isLoading ? (
                                    <div className="loading">Loading messages...</div>
                                ) : (
                                    <>
                                        {messages.map(msg => {
                                            const isOwnMessage = msg.senderId === currentUser?._id ||
                                                (typeof msg.senderId === 'object' && (msg.senderId as any)._id === currentUser?._id);

                                            return (
                                                <div
                                                    key={msg._id}
                                                    className={`message ${isOwnMessage ? 'own' : 'other'}`}
                                                >
                                                    <div className="message-content">
                                                        {!isOwnMessage && (
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
        </div>
    );
};
