import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, UnreadCount } from '../services/chatService';
import { getUnreadCount } from '../services/chatService';

/**
 * Chat Context
 * Manages WebSocket connection, notifications, and chat state
 * Isolated chat module - does not affect existing HRMS functionality
 */

interface ChatContextType {
    socket: Socket | null;
    isConnected: boolean;
    activeRoom: string | null;
    setActiveRoom: (roomId: string | null) => void;
    unreadCount: UnreadCount;
    refreshUnreadCount: () => void;
    playNotificationSound: () => void;
    isSoundMuted: boolean;
    toggleSoundMute: () => void;
    requestNotificationPermission: () => void;
    notificationPermission: NotificationPermission;
    onlineUsers: Record<string, { status: 'online' | 'away' | 'offline'; lastSeen?: string }>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    // Use absolute URL only if VITE_API_URL is set and we're not on localhost
    // Otherwise, use relative URL (leveraging Vite proxy in dev)
    if (apiUrl && apiUrl.startsWith('http') && window.location.hostname !== 'localhost') {
        const cleanUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        return cleanUrl.replace(/\/api$/, '');
    }

    // In local dev or if using proxy, connect to current origin
    return window.location.origin;
};

const SOCKET_URL = getSocketUrl();
const NOTIFICATION_SOUND_PATH = '/sounds/buy.mp3';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState<UnreadCount>({
        totalUnread: 0,
        unreadByRoom: {},
    });
    const [isSoundMuted, setIsSoundMuted] = useState(() => {
        const stored = localStorage.getItem('chat_sound_muted');
        return stored === 'true';
    });
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [onlineUsers, setOnlineUsers] = useState<Record<string, { status: 'online' | 'away' | 'offline'; lastSeen?: string }>>({});

    // Idle detection
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlockedRef = useRef(false);
    const currentUserIdRef = useRef<string | null>(null);
    const activeRoomRef = useRef<string | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        activeRoomRef.current = activeRoom;
    }, [activeRoom]);



    /**
     * Initialize audio on first user interaction
     */
    const unlockAudio = useCallback(() => {
        if (audioUnlockedRef.current) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(NOTIFICATION_SOUND_PATH);
            audioRef.current.volume = 0.5;
        }

        // Play and immediately pause to unlock audio context
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                    audioUnlockedRef.current = true;
                    console.log('✓ Chat: Audio context unlocked');
                })
                .catch((error) => {
                    console.warn('Audio unlock failed:', error);
                });
        }
    }, []);

    useEffect(() => {
        // Unlock audio on first user interaction
        const events = ['click', 'touchstart', 'keydown'];
        const handler = () => {
            unlockAudio();
            events.forEach(event => document.removeEventListener(event, handler));
        };

        events.forEach(event => document.addEventListener(event, handler, { once: true }));

        return () => {
            events.forEach(event => document.removeEventListener(event, handler));
        };
    }, [unlockAudio]);

    /**
     * Play notification sound
     */
    const playNotificationSound = useCallback(() => {
        if (isSoundMuted || !audioUnlockedRef.current || !audioRef.current) {
            return;
        }

        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.warn('Failed to play notification sound:', error);
            });
        }
    }, [isSoundMuted]);

    /**
     * Toggle sound mute
     */
    const toggleSoundMute = useCallback(() => {
        setIsSoundMuted(prev => {
            const newValue = !prev;
            localStorage.setItem('chat_sound_muted', String(newValue));
            return newValue;
        });
    }, []);

    /**
     * Request browser notification permission
     */
    const requestNotificationPermission = useCallback(async () => {
        if (typeof Notification === 'undefined') {
            console.warn('Browser notifications not supported');
            return;
        }

        if (Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);

                if (permission === 'granted') {
                    console.log('✓ Chat: Notification permission granted');
                }
            } catch (error) {
                console.error('Failed to request notification permission:', error);
            }
        }
    }, []);

    /**
     * Show browser notification
     */
    const showBrowserNotification = useCallback((senderName: string, messagePreview: string) => {
        if (
            typeof Notification === 'undefined' ||
            Notification.permission !== 'granted' ||
            !document.hidden
        ) {
            return;
        }

        try {
            const notification = new Notification('New Message', {
                body: `${senderName}: ${messagePreview}`,
                icon: '/chat-icon.png',
                tag: 'chat-message',
                requireInteraction: false,
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Focus window when notification is clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('Failed to show browser notification:', error);
        }
    }, []);

    /**
     * Refresh unread count
     */
    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    /**
     * Initialize WebSocket connection
     */
    useEffect(() => {
        const token = localStorage.getItem('hrms_token');
        const userStr = localStorage.getItem('hrms_user');

        if (!token || !userStr) {
            console.log('Chat: No auth token, skipping WebSocket connection');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            currentUserIdRef.current = user._id;
        } catch (error) {
            console.error('Failed to parse user data:', error);
            return;
        }

        console.log(`Chat: Initializing WebSocket connection to ${SOCKET_URL}...`);

        const socketInstance = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketInstance.on('connect', () => {
            console.log('✓ Chat: WebSocket connected');
            setIsConnected(true);
            refreshUnreadCount();
        });

        socketInstance.on('disconnect', () => {
            console.log('✗ Chat: WebSocket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Chat: WebSocket connection error:', error);
            setIsConnected(false);
        });

        /**
         * Handle incoming messages
         */
        socketInstance.on('receive_message', ({ message, roomId }: { message: Message; roomId: string }) => {
            const senderId = typeof message.senderId === 'object'
                ? (message.senderId as any)._id
                : message.senderId;

            // Ignore messages sent by current user
            if (senderId === currentUserIdRef.current) {
                return;
            }

            // Play notification sound
            playNotificationSound();

            // Show browser notification if chat is not active
            if (roomId !== activeRoomRef.current) {
                const messagePreview = message.messageText.length > 50
                    ? message.messageText.substring(0, 50) + '...'
                    : message.messageText;

                showBrowserNotification(message.senderName, messagePreview);
            }

            // Refresh unread count
            refreshUnreadCount();
        });

        /**
         * Handle messages read event
         */
        socketInstance.on('messages_read', () => {
            refreshUnreadCount();
        });

        // Status updates
        socketInstance.on('initial_statuses', (statuses: [string, 'online' | 'away'][]) => {
            const statusMap: Record<string, { status: 'online' | 'away' | 'offline' }> = {};
            statuses.forEach(([userId, status]) => {
                statusMap[userId] = { status };
            });
            setOnlineUsers(prev => ({ ...prev, ...statusMap }));
        });

        socketInstance.on('user_status_change', ({ userId, status, lastSeen }) => {
            setOnlineUsers(prev => ({
                ...prev,
                [userId]: { status, lastSeen },
            }));
        });

        setSocket(socketInstance);

        return () => {
            console.log('Chat: Cleaning up WebSocket connection');
            socketInstance.disconnect();
        };
    }, [playNotificationSound, showBrowserNotification, refreshUnreadCount]);

    /**
     * Idle Timer Logic
     */
    useEffect(() => {
        if (!socket || !isConnected) return;

        const setAway = () => {
            socket.emit('update_status', { status: 'away' });
        };

        let isIdle = false;

        const handleActivity = () => {
            if (isIdle) {
                isIdle = false;
                socket.emit('update_status', { status: 'online' });
            }

            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

            idleTimerRef.current = setTimeout(() => {
                isIdle = true;
                setAway();
            }, IDLE_TIMEOUT);
        };

        let throttleTimer: ReturnType<typeof setTimeout> | null = null;
        const throttledHandler = () => {
            if (!throttleTimer) {
                handleActivity();
                throttleTimer = setTimeout(() => {
                    throttleTimer = null;
                }, 1000);
            }
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, throttledHandler));

        // Initial timer start
        idleTimerRef.current = setTimeout(() => {
            isIdle = true;
            setAway();
        }, IDLE_TIMEOUT);

        return () => {
            events.forEach(event => window.removeEventListener(event, throttledHandler));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, [socket, isConnected]);

    /**
     * Auto-request notification permission on mount
     */
    useEffect(() => {
        requestNotificationPermission();
    }, [requestNotificationPermission]);

    const value: ChatContextType = {
        socket,
        isConnected,
        activeRoom,
        setActiveRoom,
        unreadCount,
        refreshUnreadCount,
        playNotificationSound,
        isSoundMuted,
        toggleSoundMute,
        requestNotificationPermission,
        notificationPermission,
        onlineUsers,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
