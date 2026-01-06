/**
 * Chat Helper Utilities
 * Common functions for chat functionality
 */

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
    if (!name) return '?';

    return name
        .trim()
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Get avatar color based on user ID (consistent hashing)
 */
export function getAvatarColor(userId: string): string {
    const colors = [
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#f59e0b', // Orange
        '#10b981', // Green
        '#06b6d4', // Cyan
        '#f43f5e', // Rose
        '#8b5cf6', // Violet
    ];

    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

/**
 * Format timestamp for chat list
 */
export function formatChatTimestamp(date: Date | string): string {
    if (!date) return '';

    const messageDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Today - show time
    if (diffDays === 0) {
        return messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Yesterday
    if (diffDays === 1) {
        return 'Yesterday';
    }

    // This week - show day name
    if (diffDays < 7) {
        return messageDate.toLocaleDateString([], { weekday: 'short' });
    }

    // Older - show date
    return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format last seen timestamp
 */
export function formatLastSeen(date: Date | string): string {
    if (!date) return 'Offline';

    const lastSeen = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return lastSeen.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Truncate message preview
 */
export function truncateMessage(message: string, maxLength: number = 50): string {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
}

/**
 * Get display name from user object
 */
export function getDisplayName(user: any): string {
    if (!user) return 'Unknown User';

    // Priority: name > staffRef.name > email > fallback
    return user.name ||
        user.staffRef?.name ||
        user.email?.split('@')[0] ||
        'Unknown User';
}

/**
 * Check if chat matches search query
 */
export function matchesSearch(chatName: string, searchQuery: string): boolean {
    if (!searchQuery) return true;

    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
}
