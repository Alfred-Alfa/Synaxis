import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { settingsService } from '../../services/settingsService';
import type { Payroll } from '../../types';
import { Calendar, FileText, Clock, DollarSign, TrendingUp, Percent } from 'lucide-react';
import '../admin/AdminTimeEntry.css';

export const StaffPayslips: React.FC = () => {
    const [payslips, setPayslips] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadPayslips();
    }, [selectedYear]);

    const getCurrencySymbol = (currencyCode: string) => {
        const symbols: Record<string, string> = {
            USD: '$', GBP: '£', EUR: '€', INR: '₹', SGD: 'S$', AUD: 'A$', CAD: 'C$', AED: 'AED '
        };
        return symbols[currencyCode] || currencyCode;
    };

    const loadPayslips = async () => {
        try {
            setLoading(true);
            const [payrollRes, settingsRes] = await Promise.all([
                payrollService.getAll({ year: selectedYear }),
                settingsService.get(),
            ]);
            setPayslips(payrollRes.data || []);
            if (settingsRes.data?.currency) {
                setCurrencySymbol(getCurrencySymbol(settingsRes.data.currency));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load payslips');
        } finally {
            setLoading(false);
        }
    };





    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

    if (loading && !payslips.length) {
        return <div className="loading">Loading payslips...</div>;
    }

    return (
        <div className="admin-time-entry fade-in">
            <div className="page-header">
                <div>
                    <h1>My Payslips</h1>
                    <p className="text-muted">View and download your payslips</p>
                </div>
                <div className="select-wrapper">
                    <select
                        className="select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ width: '120px' }}
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="error-alert mb-3">{error}</div>
            )}

            {payslips.length === 0 ? (
                <div className="card">
                    <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                        <FileText size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                        <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>No Payslips Available</h3>
                        <p style={{ color: '#94a3b8' }}>Your payslips will appear here once your employer shares them with you.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {payslips.map((payslip) => (
                        <div key={payslip._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Header */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1.25rem 1.5rem',
                                    cursor: 'pointer',
                                    background: expandedId === payslip._id ? '#f8fafc' : 'white',
                                    transition: 'background 0.2s',
                                }}
                                onClick={() => setExpandedId(expandedId === payslip._id ? null : payslip._id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                    }}>
                                        <FileText size={22} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                                            {new Date(payslip.periodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={12} />
                                            {new Date(payslip.periodStart).toLocaleDateString()} – {new Date(payslip.periodEnd).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#0f172a' }}>
                                            {currencySymbol}{payslip.totalPay.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: payslip.isPaid ? '#059669' : '#d97706' }}>
                                            {payslip.isPaid ? '✓ Paid' : '⏳ Pending'}
                                        </div>
                                    </div>


                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === payslip._id && (
                                <div style={{
                                    padding: '1.25rem 1.5rem',
                                    borderTop: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    animation: 'fadeIn 0.2s ease'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                        {/* Working Hours */}
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#3b82f6' }}>
                                                <Clock size={16} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Working Hours</span>
                                            </div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{payslip.normalHours.toFixed(1)}h</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                Regular: {currencySymbol}{payslip.normalPay.toFixed(2)}
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.25rem' }}>
                                                    ({payslip.normalHours.toFixed(1)}h × {currencySymbol}{(payslip.normalHours > 0 ? (payslip.normalPay / payslip.normalHours).toFixed(1) : 0)}/h)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Overtime Hours */}
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#d97706' }}>
                                                <TrendingUp size={16} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overtime</span>
                                            </div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{payslip.otHours.toFixed(1)}h</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                OT: {currencySymbol}{payslip.otPay.toFixed(2)}
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.25rem' }}>
                                                    ({payslip.otHours.toFixed(1)}h × {currencySymbol}{(payslip.otHours > 0 ? (payslip.otPay / payslip.otHours).toFixed(1) : 0)}/h)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Gross Pay */}
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#059669' }}>
                                                <DollarSign size={16} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gross Pay</span>
                                            </div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{currencySymbol}{(payslip.grossPay || payslip.totalPay).toFixed(2)}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {payslip.travelExpenses > 0 && <span>Travel: +{currencySymbol}{payslip.travelExpenses.toFixed(2)}</span>}
                                                {(payslip.bonus || 0) > 0 && <span>Bonus: +{currencySymbol}{(payslip.bonus || 0).toFixed(2)}</span>}
                                            </div>
                                        </div>

                                        {/* Tax / Deductions */}
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#7c3aed' }}>
                                                <Percent size={16} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deductions</span>
                                            </div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#dc2626' }}>
                                                -{currencySymbol}{((payslip.taxDeduction || 0) + (payslip.leaveDeductions || 0)).toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {payslip.taxDeduction > 0 && <span>Tax ({payslip.taxPercentage}%): -{currencySymbol}{payslip.taxDeduction.toFixed(2)}</span>}
                                                {payslip.leaveDeductions > 0 && <span>Leave: -{currencySymbol}{payslip.leaveDeductions.toFixed(2)}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Pay Summary */}
                                    <div style={{
                                        marginTop: '1rem', padding: '1rem 1.25rem',
                                        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                                        borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Net Pay (Take Home)</div>
                                        <div style={{ color: '#4ade80', fontSize: '1.5rem', fontWeight: 800 }}>
                                            {currencySymbol}{payslip.totalPay.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
