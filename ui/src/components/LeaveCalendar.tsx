import React, { useState, useEffect } from 'react';
import type { Leave, Staff } from '../types';
import './LeaveCalendar.css';

interface LeaveCalendarProps {
    leaves: Leave[];
}

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ leaves }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState<Date[]>([]);

    useEffect(() => {
        generateCalendar();
    }, [currentDate]);

    const generateCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const days: Date[] = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        setCalendarDays(days);
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const getLeavesForDay = (date: Date) => {
        return leaves.filter(leave => {
            if (leave.status !== 'Approved') return false;
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            leaveStart.setHours(0, 0, 0, 0);
            leaveEnd.setHours(23, 59, 59, 999);
            const checkDate = new Date(date);
            checkDate.setHours(12, 0, 0, 0);
            return checkDate >= leaveStart && checkDate <= leaveEnd;
        });
    };

    const getStaffName = (staffId: string | Staff) => {
        if (typeof staffId === 'object') return staffId.fullName;
        return 'Staff';
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="leave-calendar">
            <div className="calendar-header">
                <button onClick={previousMonth} className="btn btn-secondary btn-sm">
                    ← Previous
                </button>
                <h3>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="btn btn-secondary btn-sm">
                    Next →
                </button>
            </div>

            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-badge badge-success"></span>
                    <span>Paid Leave</span>
                </div>
                <div className="legend-item">
                    <span className="legend-badge badge-secondary"></span>
                    <span>Unpaid Leave</span>
                </div>
                <div className="legend-item">
                    <span className="legend-badge badge-warning"></span>
                    <span>Sick Leave</span>
                </div>
                <div className="legend-item">
                    <span className="legend-badge badge-primary"></span>
                    <span>Casual Leave</span>
                </div>
            </div>

            <div className="calendar-grid">
                <div className="calendar-days-header">
                    {dayNames.map(day => (
                        <div key={day} className="calendar-day-name">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="calendar-days">
                    {calendarDays.map((date, index) => {
                        const dayLeaves = getLeavesForDay(date);
                        return (
                            <div
                                key={index}
                                className={`calendar-day ${!isCurrentMonth(date) ? 'other-month' : ''} ${isToday(date) ? 'today' : ''
                                    }`}
                            >
                                <div className="day-number">{date.getDate()}</div>
                                <div className="day-leaves">
                                    {dayLeaves.map((leave, idx) => (
                                        <div
                                            key={idx}
                                            className={`leave-indicator badge-${leave.leaveType === 'Paid' ? 'success' :
                                                leave.leaveType === 'Sick' ? 'warning' :
                                                    leave.leaveType === 'Casual' ? 'primary' : 'secondary'
                                                }`}
                                            title={`${getStaffName(leave.staffId)} - ${leave.leaveType} Leave${leave.isHalfDay ? ` (Half Day - ${leave.halfDaySession || ''})` : ''
                                                }`}
                                        >
                                            {getStaffName(leave.staffId).split(' ')[0]}
                                            {leave.isHalfDay && ' (½)'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
