import React, { useEffect, useState } from 'react';
import { announcementService } from '../../services/announcementService';

export const AnnouncementBadge: React.FC = () => {
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const checkUnread = async () => {
            try {
                const announcements = await announcementService.getAll();
                if (announcements.length > 0) {
                    const latestDate = new Date(announcements[0].createdAt).getTime();
                    const lastSeenStr = localStorage.getItem('lastSeenAnnouncementDate');
                    const lastSeenDate = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;

                    if (latestDate > lastSeenDate) {
                        setHasUnread(true);
                    } else {
                        setHasUnread(false);
                    }
                }
            } catch (error) {
                console.error("Failed to check announcements", error);
            }
        };

        checkUnread();

        // Listen to local storage changes to clear badge when visited
        const handleStorageChange = () => {
            checkUnread();
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('announcements-viewed', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('announcements-viewed', handleStorageChange);
        };
    }, []);

    if (!hasUnread) return null;

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
            title="New announcements"
        />
    );
};
