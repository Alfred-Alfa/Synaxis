import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import { timeEntryService } from '../../services/timeEntryService';
import { overtimeService } from '../../services/overtimeService';
import { leaveService } from '../../services/leaveService';
import type { Staff, TimeEntry, Overtime, Leave } from '../../types';
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

  const getTotalPending = () => {
    return stats.pendingTimeEntries + stats.pendingOvertime + stats.pendingLeave;
  };

  const getStaffName = (staffId: string | any) => {
    if (typeof staffId === 'object' && staffId?.fullName) return staffId.fullName;
    return 'Staff Member';
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Welcome back! Here's your overview</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <span style={{ fontSize: '2rem' }}>👥</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeStaff}</div>
            <div className="stat-label">Active Staff</div>
            <div className="stat-sublabel">{stats.totalStaff} total</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-yellow">
            <span style={{ fontSize: '2rem' }}>⏰</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingTimeEntries}</div>
            <div className="stat-label">Pending Time Entries</div>
            <div className="stat-sublabel">Awaiting approval</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-pink">
            <span style={{ fontSize: '2rem' }}>💼</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingOvertime}</div>
            <div className="stat-label">Pending OT Requests</div>
            <div className="stat-sublabel">Awaiting approval</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-green">
            <span style={{ fontSize: '2rem' }}>🏖️</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingLeave}</div>
            <div className="stat-label">Pending Leave</div>
            <div className="stat-sublabel">Awaiting approval</div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Widget */}
      {getTotalPending() > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h3>Pending Approvals ({getTotalPending()})</h3>
          </div>

          {stats.pendingTimeEntries > 0 && (
            <div className="pending-section">
              <div className="pending-section-header">
                <h4>Time Entries ({stats.pendingTimeEntries})</h4>
                <button onClick={() => navigate('/admin/time-entries')} className="btn btn-sm btn-secondary">
                  View All
                </button>
              </div>
              <div className="pending-list">
                {pendingItems.timeEntries.map((entry) => (
                  <div key={entry._id} className="pending-item">
                    <div className="pending-item-content">
                      <strong>{getStaffName(entry.staffId)}</strong>
                      <span className="text-muted">
                        {new Date(entry.date).toLocaleDateString()} - {entry.totalHours.toFixed(2)} hrs
                      </span>
                    </div>
                    <span className="badge badge-warning">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.pendingOvertime > 0 && (
            <div className="pending-section">
              <div className="pending-section-header">
                <h4>Overtime Requests ({stats.pendingOvertime})</h4>
                <button onClick={() => navigate('/admin/overtime')} className="btn btn-sm btn-secondary">
                  View All
                </button>
              </div>
              <div className="pending-list">
                {pendingItems.overtime.map((ot) => (
                  <div key={ot._id} className="pending-item">
                    <div className="pending-item-content">
                      <strong>{getStaffName(ot.staffId)}</strong>
                      <span className="text-muted">
                        {new Date(ot.date).toLocaleDateString()} - {ot.otHours.toFixed(2)} hrs
                      </span>
                    </div>
                    <span className="badge badge-warning">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.pendingLeave > 0 && (
            <div className="pending-section">
              <div className="pending-section-header">
                <h4>Leave Applications ({stats.pendingLeave})</h4>
                <button onClick={() => navigate('/admin/leave')} className="btn btn-sm btn-secondary">
                  View All
                </button>
              </div>
              <div className="pending-list">
                {pendingItems.leave.map((leave) => (
                  <div key={leave._id} className="pending-item">
                    <div className="pending-item-content">
                      <strong>{getStaffName(leave.staffId)}</strong>
                      <span className="text-muted">
                        {new Date(leave.startDate).toLocaleDateString()} - {leave.totalDays} days
                      </span>
                    </div>
                    <span className={`badge badge-${leave.leaveType === 'Paid' ? 'success' :
                      leave.leaveType === 'Sick' ? 'warning' : 'secondary'
                      }`}>
                      {leave.leaveType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts & Visualizations */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Analytics Overview</h3>
        </div>

        <div className="charts-grid">
          {/* Approval Status Breakdown */}
          <div className="chart-section">
            <h4>Pending Approvals Breakdown</h4>
            <div className="donut-chart">
              <div className="donut-segment donut-time" style={{
                '--percentage': getTotalPending() > 0 ? (stats.pendingTimeEntries / getTotalPending() * 100) : 0
              } as any}>
              </div>
              <div className="donut-center">
                <div className="donut-value">{getTotalPending()}</div>
                <div className="donut-label">Total</div>
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Time Entries: {stats.pendingTimeEntries}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ec4899' }}></span>
                <span>Overtime: {stats.pendingOvertime}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                <span>Leave: {stats.pendingLeave}</span>
              </div>
            </div>
          </div>

          {/* Staff Status Distribution */}
          <div className="chart-section">
            <h4>Staff Distribution</h4>
            <div className="progress-chart">
              <div className="progress-bar-wrapper">
                <div className="progress-label">
                  <span>Active Staff</span>
                  <span>{stats.activeStaff}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill progress-active"
                    style={{ width: `${stats.totalStaff > 0 ? (stats.activeStaff / stats.totalStaff * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="progress-bar-wrapper">
                <div className="progress-label">
                  <span>Inactive Staff</span>
                  <span>{stats.totalStaff - stats.activeStaff}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill progress-inactive"
                    style={{ width: `${stats.totalStaff > 0 ? ((stats.totalStaff - stats.activeStaff) / stats.totalStaff * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="chart-summary">
              Total: <strong>{stats.totalStaff}</strong> staff members
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="quick-actions">
          <button onClick={() => navigate('/admin/staff')} className="action-btn">
            <span className="action-icon">👥</span>
            <span className="action-label">Manage Staff</span>
          </button>
          <button onClick={() => navigate('/admin/time-entries')} className="action-btn">
            <span className="action-icon">⏰</span>
            <span className="action-label">Time Entries</span>
          </button>
          <button onClick={() => navigate('/admin/overtime')} className="action-btn">
            <span className="action-icon">💼</span>
            <span className="action-label">Overtime</span>
          </button>
          <button onClick={() => navigate('/admin/leave')} className="action-btn">
            <span className="action-label">🏖️</span>
            <span className="action-label">Leave Requests</span>
          </button>
          <button onClick={() => navigate('/admin/payroll')} className="action-btn">
            <span className="action-icon">💰</span>
            <span className="action-label">Payroll</span>
          </button>
          <button onClick={() => navigate('/admin/sites')} className="action-btn">
            <span className="action-icon">🏢</span>
            <span className="action-label">Sites/Projects</span>
          </button>
          <button onClick={() => navigate('/admin/settings')} className="action-btn">
            <span className="action-icon">⚙️</span>
            <span className="action-label">Settings</span>
          </button>
          <button onClick={() => navigate('/admin/audit-logs')} className="action-btn">
            <span className="action-icon">📋</span>
            <span className="action-label">Audit Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
