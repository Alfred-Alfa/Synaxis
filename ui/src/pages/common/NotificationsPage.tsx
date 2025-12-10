import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import './NotificationsPage.css';

export const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getAll();
            setNotifications(response.data || []);
        } catch (err: any) {
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, link?: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );

            if (link) {
                navigate(link);
            }
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    if (loading) {
        return <div className="loading">Loading notifications...</div>;
    }

    return (
        <div className="notifications-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="text-muted">Stay updated with your activities</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button onClick={handleMarkAllAsRead} className="btn btn-secondary">
                        Mark All as Read
                    </button>
                )}
            </div>

            {error && <div className="error-alert mb-3">{error}</div>}

            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <p>No notifications</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification._id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.type.toLowerCase()}`}
                            onClick={() => handleMarkAsRead(notification._id, notification.link)}
                        >
                            <div className="notification-icon">
                                {notification.type === 'SUCCESS' && '✅'}
                                {notification.type === 'ERROR' && '❌'}
                                {notification.type === 'WARNING' && '⚠️'}
                                {notification.type === 'INFO' && 'ℹ️'}
                            </div>
                            <div className="notification-content">
                                <div className="notification-header">
                                    <h4 className="notification-title">{notification.title}</h4>
                                    <span className="notification-time">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                            </div>
                            {!notification.isRead && <div className="unread-dot"></div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
