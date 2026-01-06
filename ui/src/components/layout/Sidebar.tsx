import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChatBadge } from '../common/ChatBadge';
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
    Briefcase
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { isAdmin, user } = useAuth();

    const adminLinks = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/staff', label: 'Staff Management', icon: Users },
        { to: '/admin/time-entries', label: 'Time Entries', icon: Clock },
        { to: '/admin/overtime', label: 'Overtime', icon: Timer },
        { to: '/admin/leave', label: 'Leave Requests', icon: CalendarDays },
        { to: '/admin/sites', label: 'Sites/Projects', icon: Building2 },
        { to: '/admin/payroll', label: 'Payroll', icon: Banknote },
        { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    ];

    const staffLinks = [
        { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/staff/time-entries', label: 'Time Entries', icon: Clock },
        { to: '/staff/overtime', label: 'Overtime', icon: Timer },
        { to: '/staff/leave', label: 'Leave', icon: CalendarDays },
    ];

    const myAppsLinks = [
        { to: '/staff/time-entries', label: 'My Time Entries', icon: Clock },
        { to: '/staff/overtime', label: 'My Overtime', icon: Timer },
        { to: '/staff/leave', label: 'My Leave', icon: CalendarDays },
    ];

    // Chat link
    const chatLink = {
        to: isAdmin ? '/admin/chat' : '/staff/chat',
        label: 'Chat',
        icon: MessageSquare,
        showBadge: true
    };

    const settingsLink = { to: '/admin/settings', label: 'Settings', icon: Settings };

    const links = isAdmin
        ? [
            ...adminLinks,
            chatLink,
            ...(user?.role === 'SuperAdmin' ? [] : myAppsLinks),
            settingsLink
        ]
        : [...staffLinks, chatLink];

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-icon">
                        <Briefcase size={24} color="white" />
                    </div>
                    <span className="logo-text">HRMS Pro</span>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => {
                                if (window.innerWidth <= 768) {
                                    onClose();
                                }
                            }}
                        >
                            <link.icon className="sidebar-icon" size={18} />
                            <span className="sidebar-label">
                                {link.label}
                            </span>
                            {(link as any).showBadge && <div style={{ marginLeft: 'auto' }}><ChatBadge /></div>}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};
