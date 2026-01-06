import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

interface UserAvatarProps {
    userId: string;
    name: string;
    size?: 'small' | 'medium' | 'large';
    showOnline?: boolean;
    isOnline?: boolean;
    onClick?: () => void;
}

/**
 * User Avatar Component
 * Displays user initials with color-coded background
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
    userId,
    name,
    size = 'medium',
    showOnline = false,
    isOnline = false,
    onClick
}) => {
    const initials = getInitials(name);
    const bgColor = getAvatarColor(userId);

    const sizeMap = {
        small: { width: '32px', height: '32px', fontSize: '12px', indicator: '8px' },
        medium: { width: '40px', height: '40px', fontSize: '14px', indicator: '10px' },
        large: { width: '56px', height: '56px', fontSize: '18px', indicator: '12px' }
    };

    const dimensions = sizeMap[size];

    return (
        <div
            className="user-avatar"
            onClick={onClick}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                borderRadius: '50%',
                background: bgColor,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: dimensions.fontSize,
                fontWeight: '600',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
                flexShrink: 0,
                userSelect: 'none'
            }}
        >
            {initials}

            {showOnline && (
                <div
                    className="online-indicator"
                    style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: dimensions.indicator,
                        height: dimensions.indicator,
                        borderRadius: '50%',
                        background: isOnline ? '#10b981' : '#6b7280',
                        border: '2px solid white',
                        boxShadow: '0 0 4px rgba(0,0,0,0.1)'
                    }}
                    title={isOnline ? 'Online' : 'Offline'}
                />
            )}
        </div>
    );
};
