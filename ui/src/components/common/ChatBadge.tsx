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
                display: 'inline-block',
                backgroundColor: '#f44336',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginLeft: '0.5rem',
            }}
            title={`${unreadCount.totalUnread} unread messages`}
        />
    );
};
