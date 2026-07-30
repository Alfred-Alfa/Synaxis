import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChatBadge } from '../common/ChatBadge';
import { AnnouncementBadge } from '../common/AnnouncementBadge';
import { settingsService } from '../../services/settingsService';
import {
    LayoutDashboard,
    Users,
    Clock,
    Timer,
    CalendarDays,
    Building2,
    Banknote,
    BarChart3,
    FileText,
    Settings,
    MessageSquare,
    Megaphone,
    MapPin
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { isAdmin, isSuperAdmin, user } = useAuth();
    const [companyConfig, setCompanyConfig] = useState<{ logo: string, name: string }>({ logo: '', name: 'SYNTAX HRMS' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsService.get();
                if (response.data) {
                    setCompanyConfig({
                        logo: response.data.companyLogo || '',
                        name: response.data.companyName || 'SYNTAX HRMS'
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);

    // === SUPERADMIN — full access to all admin pages ===
    const superAdminLinks = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/staff', label: 'Staff Management', icon: Users },
        { to: '/admin/time-entries', label: 'Time Entries', icon: Clock },
        { to: '/admin/overtime', label: 'Overtime', icon: Timer },
        { to: '/admin/leave', label: 'Leave Requests', icon: CalendarDays },
        { to: '/admin/sites', label: 'Sites/Projects', icon: Building2 },
        { to: '/admin/location-requests', label: 'Location Requests', icon: MapPin },
        { to: '/admin/payroll', label: 'Payroll', icon: Banknote },
        { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    ];

    // === ADMIN — operational access only (no sensitive financial/audit pages) ===
    const adminOnlyLinks = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/time-entries', label: 'Time Entries', icon: Clock },
        { to: '/admin/overtime', label: 'Overtime', icon: Timer },
        { to: '/admin/leave', label: 'Leave Requests', icon: CalendarDays },
        { to: '/admin/sites', label: 'Sites/Projects', icon: Building2 },
        { to: '/admin/location-requests', label: 'Location Requests', icon: MapPin },
    ];

    const staffLinks = [
        { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/staff/time-entries', label: 'Time Entries', icon: Clock },
        { to: '/staff/overtime', label: 'Overtime', icon: Timer },
        { to: '/staff/leave', label: 'Leave', icon: CalendarDays },
        { to: '/staff/location-requests', label: 'My Locations', icon: MapPin },
        { to: '/staff/payslips', label: 'My Payslips', icon: Banknote },
    ];

    // Announcements loop
    const announcementsLink = {
        to: isAdmin ? '/admin/announcements' : '/staff/announcements',
        label: 'Announcements',
        icon: Megaphone,
        showAnnouncementBadge: true
    };

    // Chat link
    const chatLink = {
        to: isAdmin ? '/admin/chat' : '/staff/chat',
        label: 'Chat',
        icon: MessageSquare,
        showBadge: true
    };

    const settingsLink = { to: '/admin/settings', label: 'Settings', icon: Settings };

    const mainLinks = isAdmin
        ? (user?.role === 'SuperAdmin' ? superAdminLinks : adminOnlyLinks)
        : staffLinks;

    const bottomLinks = [
        announcementsLink,
        chatLink,
        ...(isSuperAdmin ? [settingsLink] : [])
    ];

    return (
        <>
            <div
                className={`sidebar-overlay-v2 ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <aside className={`sidebar-v2 ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo-v2">
                    <img
                        src="/assets/static/synaxislogo.svg"
                        alt={companyConfig.name}
                    />
                </div>

                <div className="sidebar-section-v2">
                    <div className="sidebar-label-v2">Menu</div>
                    {mainLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `nav-item-v2 ${isActive ? 'active' : ''}`
                            }
                            onClick={() => {
                                if (window.innerWidth <= 768) {
                                    onClose();
                                }
                            }}
                        >
                            <div className="nav-icon-v2">
                                <link.icon size={18} />
                            </div>
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className="sidebar-bottom-v2">
                    <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                        {bottomLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `nav-item-v2 ${isActive ? 'active' : ''}`
                                }
                                onClick={() => {
                                    if (window.innerWidth <= 768) {
                                        onClose();
                                    }
                                }}
                            >
                                <div className="nav-icon-v2">
                                    <link.icon size={18} />
                                </div>
                                {link.label}
                                {/* @ts-ignore */}
                                {link.showBadge && <div style={{ marginLeft: 'auto' }}><ChatBadge /></div>}
                                {/* @ts-ignore */}
                                {link.showAnnouncementBadge && <div style={{ marginLeft: 'auto' }}><AnnouncementBadge /></div>}
                            </NavLink>
                        ))}
                    </div>

                    <div className="user-card-v2" onClick={() => window.location.href = isSuperAdmin ? '/admin/settings' : (isAdmin ? '/admin/profile' : '/staff/profile')}>
                        <div className="avatar-v2">
                            {user?.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="user-info-v2">
                            <div className="user-name-v2">{user?.email?.split('@')[0]}</div>
                            <div className="user-role-v2">{user?.role}</div>
                        </div>
                        <span style={{ color: 'var(--muted2)', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <Settings size={16} />
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};
