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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    // Case 1: VITE_API_URL is not set (undefined or empty)
    if (!apiUrl) {
        return 'http://localhost:5000';
    }

    // Case 2: VITE_API_URL is an absolute URL (http://... or https://...)
    if (apiUrl.startsWith('http')) {
        // Remove trailing slash if present
        const cleanUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        // Remove /api suffix if present
        return cleanUrl.replace(/\/api$/, '');
    }

    // Case 3: VITE_API_URL is a relative path (e.g. "/api")
    // In production (same origin), the socket should connect to the root "/"
    return '/';
};

const SOCKET_URL = getSocketUrl();
const NOTIFICATION_SOUND_PATH = '/sounds/chat-notification.mp3';

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

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlockedRef = useRef(false);
    const currentUserIdRef = useRef<string | null>(null);

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

        console.log('Chat: Initializing WebSocket connection...');

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
            if (roomId !== activeRoom) {
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

        setSocket(socketInstance);

        return () => {
            console.log('Chat: Cleaning up WebSocket connection');
            socketInstance.disconnect();
        };
    }, [activeRoom, playNotificationSound, showBrowserNotification, refreshUnreadCount]);

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
