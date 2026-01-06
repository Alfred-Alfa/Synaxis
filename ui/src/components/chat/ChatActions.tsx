import React, { useState, useRef, useEffect } from 'react';
import {
    MoreVertical,
    Archive,
    Pin,
    BellOff,
    Bell,
    Trash2,
    X,
    LogOut,
    ArchiveRestore,
    PinOff
} from 'lucide-react';

interface ChatActionsProps {
    roomId: string;
    roomType: 'direct' | 'group';
    isArchived?: boolean;
    isPinned?: boolean;
    isMuted?: boolean;
    onArchive: () => void;
    onPin: () => void;
    onMute: () => void;
    onDelete: () => void;
    onClear: () => void;
    onLeave?: () => void; // Only for groups
}

export const ChatActions: React.FC<ChatActionsProps> = ({
    roomType,
    isArchived = false,
    isPinned = false,
    isMuted = false,
    onArchive,
    onPin,
    onMute,
    onDelete,
    onClear,
    onLeave,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            {/* Three-dot button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                title="Chat actions"
            >
                <MoreVertical size={18} />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                        zIndex: 1000,
                        minWidth: '180px',
                        padding: '4px 0'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Pin/Unpin */}
                    <button
                        onClick={() => handleAction(onPin)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                        {isPinned ? 'Unpin chat' : 'Pin chat'}
                    </button>

                    {/* Mute/Unmute */}
                    <button
                        onClick={() => handleAction(onMute)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        {isMuted ? <Bell size={16} /> : <BellOff size={16} />}
                        {isMuted ? 'Unmute' : 'Mute notifications'}
                    </button>

                    {/* Archive/Unarchive */}
                    <button
                        onClick={() => handleAction(onArchive)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        {isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                        {isArchived ? 'Unarchive' : 'Archive chat'}
                    </button>

                    {/* Divider */}
                    <div style={{
                        height: '1px',
                        background: '#e5e7eb',
                        margin: '4px 0'
                    }} />

                    {/* Clear history */}
                    <button
                        onClick={() => handleAction(onClear)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <X size={16} />
                        Clear history
                    </button>

                    {/* Leave group (only for groups) */}
                    {roomType === 'group' && onLeave && (
                        <button
                            onClick={() => handleAction(onLeave)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                color: '#ef4444',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <LogOut size={16} />
                            Leave group
                        </button>
                    )}

                    {/* Delete */}
                    <button
                        onClick={() => handleAction(onDelete)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#ef4444',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <Trash2 size={16} />
                        Delete chat
                    </button>
                </div>
            )}
        </div>
    );
};
