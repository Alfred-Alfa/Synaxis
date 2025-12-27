import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { ChatDrawer } from './ChatDrawer';
import './ChatDrawer.css';

export const ChatBubble: React.FC = () => {
    const { unreadCount, onlineUsers } = useChat();
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => setIsOpen(!isOpen);

    return (
        <div className="chat-bubble-container">
            {/* Drawer Component - conditionally rendered or visible based on state */}
            {isOpen && (
                <ChatDrawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                />
            )}

            {/* Floating Action Button */}
            <button
                className="chat-bubble-btn"
                onClick={toggleChat}
                title={isOpen ? "Close Chat" : "Open Chat"}
            >
                {isOpen ? (
                    <X size={28} />
                ) : (
                    <MessageCircle size={28} />
                )}

                {/* Unread Badge */}
                {!isOpen && unreadCount.totalUnread > 0 && (
                    <div className="chat-bubble-badge">
                        {unreadCount.totalUnread > 99 ? '99+' : unreadCount.totalUnread}
                    </div>
                )}

                {/* Status Indicator */}
                {!isOpen && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: Object.values(onlineUsers).some(u => u.status === 'online')
                            ? '#22C55E'
                            : Object.values(onlineUsers).some(u => u.status === 'away')
                                ? '#FACC15'
                                : '#9CA3AF',
                        border: '2px solid white',
                        zIndex: 5
                    }} title="User Presence" />
                )}
            </button>
        </div>
    );
};
