import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { leaveService } from '../../services/leaveService';
import type { Staff, TimeEntry, Overtime, Leave } from '../../types';
import {
  Users,
  Clock,
  Timer,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    pendingTimeEntries: 0,
    pendingOvertime: 0,
    pendingLeave: 0,
  });
  const [pendingItems, setPendingItems] = useState<{
    timeEntries: TimeEntry[];
    overtime: Overtime[];
    leave: Leave[];
  }>({
    timeEntries: [],
    overtime: [],
    leave: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [staffRes, timeRes, otRes, leaveRes] = await Promise.all([
        staffService.getAll(),
        timeEntryService.getAll({ status: 'Pending' }),
        overtimeService.getAll({ status: 'Pending' }),
        leaveService.getAll({ status: 'Pending' }),
      ]);

      const staffData = staffRes.data || [];
      const activeStaff = staffData.filter((s: Staff) => s.employmentStatus === 'Active');

      setStats({
        totalStaff: staffData.length,
        activeStaff: activeStaff.length,
        pendingTimeEntries: (timeRes.data || []).length,
        pendingOvertime: (otRes.data || []).length,
        pendingLeave: (leaveRes.data || []).length,
      });

      setPendingItems({
        timeEntries: (timeRes.data || []).slice(0, 5),
        overtime: (otRes.data || []).slice(0, 5),
        leave: (leaveRes.data || []).slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffName = (staffId: string | any) => {
    if (typeof staffId === 'object' && staffId?.fullName) return staffId.fullName;
    return 'Staff Member';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <span>Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Overview of your workforce and pending tasks.</p>
        </div>
        <div className="date-display">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/admin/staff')}>
          <div className="kpi-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.activeStaff}</div>
            <div className="kpi-label">Active Staff</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/time-entries')}>
          <div className="kpi-icon-wrapper amber">
            <Clock size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.pendingTimeEntries}</div>
            <div className="kpi-label">Pending Time Entries</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/overtime')}>
          <div className="kpi-icon-wrapper orange">
            <Timer size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.pendingOvertime}</div>
            <div className="kpi-label">Pending Overtime</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/leave')}>
          <div className="kpi-icon-wrapper green">
            <Calendar size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.pendingLeave}</div>
            <div className="kpi-label">Pending Leave</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* Left Column: Pending Actions */}
        <div className="dashboard-section main-section">
          <div className="section-header">
            <h3>Pending Approvals</h3>
          </div>

          <div className="card-flat">
            {stats.pendingTimeEntries === 0 && stats.pendingOvertime === 0 && stats.pendingLeave === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={48} className="text-muted" />
                <p>All caught up! No pending approvals.</p>
              </div>
            ) : (
              <div className="pending-list">
                {/* Time Entries */}
                {pendingItems.timeEntries.map(item => (
                  <div key={item._id} className="pending-item" onClick={() => navigate('/admin/time-entries')}>
                    <div className="pending-icon"><Clock size={16} /></div>
                    <div className="pending-details">
                      <span className="pending-title">{getStaffName(item.staffId)}</span>
                      <span className="pending-subtitle">Time Entry • {item.totalHours} hrs</span>
                    </div>
                    <ArrowRight size={16} className="arrow-icon" />
                  </div>
                ))}

                {/* Overtime */}
                {pendingItems.overtime.map(item => (
                  <div key={item._id} className="pending-item" onClick={() => navigate('/admin/overtime')}>
                    <div className="pending-icon"><Timer size={16} /></div>
                    <div className="pending-details">
                      <span className="pending-title">{getStaffName(item.staffId)}</span>
                      <span className="pending-subtitle">Overtime • {item.otHours} hrs</span>
                    </div>
                    <ArrowRight size={16} className="arrow-icon" />
                  </div>
                ))}

                {/* Leave */}
                {pendingItems.leave.map(item => (
                  <div key={item._id} className="pending-item" onClick={() => navigate('/admin/leave')}>
                    <div className="pending-icon"><Calendar size={16} /></div>
                    <div className="pending-details">
                      <span className="pending-title">{getStaffName(item.staffId)}</span>
                      <span className="pending-subtitle">Leave • {item.leaveType}</span>
                    </div>
                    <ArrowRight size={16} className="arrow-icon" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Stats / Actions */}
        <div className="dashboard-section side-section">
          <div className="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-flat custom-padding">
            <button className="quick-action-btn" onClick={() => navigate('/admin/staff/new')}>
              Add New Staff
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/reports')}>
              Generate Reports
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/payroll')}>
              Process Payroll
            </button>
          </div>

          <div className="section-header" style={{ marginTop: '2rem' }}>
            <h3>System Status</h3>
          </div>
          <div className="card-flat">
            <div className="system-status-item">
              <div className="status-indicator online"></div>
              <span>All Systems Operational</span>
            </div>
            <div className="system-version text-muted">
              Version 2.4.0 (Enterprise)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
