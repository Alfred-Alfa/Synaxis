import React from 'react';
import { useChat } from '../../contexts/ChatContext';

/**
 * Chat Badge Component
 * Shows unread message count badge on navigation items
 * Isolated chat module
 */

export const ChatBadge: React.FC = () => {
    const { unreadCount } = useChat();

    if (unreadCount.totalUnread === 0) {
        return null;
    }

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f44336',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.125rem 0.5rem',
                borderRadius: '12px',
                minWidth: '20px',
                marginLeft: '0.5rem',
            }}
        >
            {unreadCount.totalUnread > 99 ? '99+' : unreadCount.totalUnread}
        </span>
    );
};
