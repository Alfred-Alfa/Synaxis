import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementService, type Announcement } from '../../services/announcementService';
import { Megaphone, AlertCircle, Plus, X, Trash2 } from 'lucide-react';
import './AnnouncementsWidget.css';

export const AnnouncementsWidget: React.FC = () => {
    const { isAdmin } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Admin
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'important' | 'normal'>('normal');

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await announcementService.getAll();
            setAnnouncements(data);

            // Mark as read
            localStorage.setItem('lastSeenAnnouncementDate', Date.now().toString());
            window.dispatchEvent(new Event('announcements-viewed'));
        } catch (error) {
            console.error('Failed to load announcements', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await announcementService.create({ title, message, type });
            setShowModal(false);
            setTitle('');
            setMessage('');
            setType('normal');
            loadAnnouncements();
        } catch (error) {
            console.error('Failed to create announcement', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this broadcast?')) {
            try {
                await announcementService.delete(id);
                loadAnnouncements();
            } catch (error) {
                console.error('Failed to delete announcement', error);
            }
        }
    };

    return (
        <div className="announcements-widget">
            <div className="announcements-header">
                <h3><Megaphone size={18} /> Company Broadcasts</h3>
                {isAdmin && (
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        <Plus size={14} /> New Broadcast
                    </button>
                )}
            </div>

            <div className="announcements-list">
                {loading ? (
                    <div className="loading-state">Loading...</div>
                ) : announcements.length === 0 ? (
                    <div className="empty-state">
                        <p>No recent broadcasts.</p>
                    </div>
                ) : (
                    announcements.map(item => (
                        <div key={item._id} className={`announcement-item ${item.type}`}>
                            <div className="item-header">
                                <div className="title-row">
                                    {item.type === 'important' && <AlertCircle size={14} className="important-icon" />}
                                    <h4>{item.title}</h4>
                                </div>
                                {isAdmin && (
                                    <button className="del-btn" onClick={() => handleDelete(item._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="item-message">{item.message}</p>
                            <div className="item-meta">
                                <span>{item.createdBy?.staffRef?.name || item.createdBy?.email}</span>
                                <span> • </span>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && isAdmin && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Broadcast</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="broadcast-form">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Office Closure, New Policy"
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                    rows={4}
                                    placeholder="Enter details here..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Label / Priority</label>
                                <select value={type} onChange={e => setType(e.target.value as 'important' | 'normal')}>
                                    <option value="normal">Normal</option>
                                    <option value="important">Important (Red Label)</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Send Broadcast</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
