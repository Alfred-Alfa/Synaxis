import React from 'react';
import { AnnouncementsWidget } from '../../components/common/AnnouncementsWidget';

export const AnnouncementsPage: React.FC = () => {
    return (
        <div className="fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Company Announcements</h1>
                <p style={{ color: 'var(--muted2)' }}>Stay up to date with the latest news and broadcasts.</p>
            </div>
            <AnnouncementsWidget />
        </div>
    );
};
