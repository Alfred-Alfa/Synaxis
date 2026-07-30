"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import './login-v2.css';

interface LoginFormProps {
    email?: string;
    setEmail?: (val: string) => void;
    password?: string;
    setPassword?: (val: string) => void;
    onSubmit?: (e: React.FormEvent) => void;
    loading?: boolean;
    error?: string;
    onForgotPassword?: () => void;
    onGoogleLogin?: (token: string) => void;
    portalLabel?: string;
    wrongPortalUrl?: string;
    wrongPortalLabel?: string;
}

export function LoginForm({
    email,
    setEmail,
    password,
    setPassword,
    onSubmit,
    loading,
    error,
    onForgotPassword,
    onGoogleLogin,
    portalLabel,
    wrongPortalUrl,
    wrongPortalLabel,
}: LoginFormProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: (codeResponse) => {
            if (onGoogleLogin && codeResponse.access_token) {
                onGoogleLogin(codeResponse.access_token);
            }
        },
        onError: (error) => console.log('Google Login Failed:', error)
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W: number, H: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const particles: any[] = [];
        let animationFrameId: number;

        function resize() {
            if (!canvas) return;
            const parent = canvas.parentElement;
            if (parent) {
                W = canvas.width = parent.clientWidth;
                H = canvas.height = parent.clientHeight;
            } else {
                W = canvas.width = window.innerWidth;
                H = canvas.height = window.innerHeight;
            }
        }

        function createParticle() {
            return {
                x: Math.random() * W * 0.6,
                y: Math.random() * H,
                r: Math.random() * 1.5 + 0.3,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -(Math.random() * 0.5 + 0.2),
                alpha: Math.random() * 0.5 + 0.1,
                color: Math.random() > 0.5 ? '108,58,255' : '6,182,212'
            };
        }

        resize();
        for (let i = 0; i < 80; i++) particles.push(createParticle());

        function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, W, H);
            for (const p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
                ctx.fill();
                p.x += p.vx; p.y += p.vy;
                if (p.y < -5) { Object.assign(p, createParticle()); p.y = H + 5; }
            }
            animationFrameId = requestAnimationFrame(animate);
        }

        animate();
        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) onSubmit(e);
    };

    return (
        <div className="login-v2-container">
            <canvas id="particles" ref={canvasRef}></canvas>

            {/* LEFT PANEL */}
            <div className="left">
                <div className="grid-bg"></div>
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>

                <div className="logo">
                    <img src="/assets/static/synaxislogo.svg" alt="Synaxis" style={{ height: '44px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                </div>

                <div className="hero-content">
                    <div className="eyebrow">
                        <div className="eyebrow-dot"></div>
                        Workforce Intelligence Platform
                    </div>
                    <h1>
                        Manage your<br />
                        workforce<br />
                        <span className="line-accent">smarter.</span>
                    </h1>
                    <p className="hero-desc">
                        All-in-one platform to streamline leave, attendance, and payroll — powered by real-time intelligence.
                    </p>

                    <div className="features">
                        <div className="feat">
                            <div className="feat-icon blue">📅</div>
                            <div className="feat-info">
                                <h3>Leave Management</h3>
                                <p>Apply & track leaves seamlessly</p>
                            </div>
                            <span className="feat-badge">LIVE</span>
                        </div>
                        <div className="feat">
                            <div className="feat-icon purple">📍</div>
                            <div className="feat-info">
                                <h3>Geo-Attendance</h3>
                                <p>Location-verified check-ins</p>
                            </div>
                            <span className="feat-badge">LIVE</span>
                        </div>
                        <div className="feat">
                            <div className="feat-icon gold">💰</div>
                            <div className="feat-info">
                                <h3>Payroll</h3>
                                <p>Automated salary processing</p>
                            </div>
                            <span className="feat-badge">LIVE</span>
                        </div>
                    </div>
                </div>

                <div className="left-footer">© 2025 Synaxis. All rights reserved.</div>
            </div>

            {/* RIGHT PANEL */}
            <div className="right">
                <div className="right-particle" style={{ top: '15%', left: '10%', animationDelay: '0s' }}></div>
                <div className="right-particle" style={{ top: '75%', left: '85%', animationDelay: '-2s', width: '4px', height: '4px' }}></div>
                <div className="right-particle" style={{ top: '40%', left: '90%', animationDelay: '-4s', background: 'var(--cyan)' }}></div>

                <div className="form-container">
                    <div className="brand-mark" style={{ justifyContent: 'center', marginBottom: '2.5rem' }}>
                        <img src="/assets/static/synaxislogo.svg" alt="Synaxis" style={{ height: '52px', objectFit: 'contain' }} />
                    </div>

                    <div className="welcome">
                        <h2>Welcome back</h2>
                        {portalLabel && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.25rem 0.75rem', borderRadius: '999px',
                                background: portalLabel.includes('Admin') ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                                color: portalLabel.includes('Admin') ? '#818cf8' : '#34d399',
                                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em',
                                marginBottom: '0.5rem', marginTop: '0.25rem'
                            }}>
                                <span>{portalLabel.includes('Admin') ? '🔐' : '👤'}</span>
                                {portalLabel.toUpperCase()}
                            </div>
                        )}
                        <p>Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleFormSubmit}>
                        <div className="field">
                            <label>Email <span>*</span></label>
                            <div className="input-wrap">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email || ''}
                                    onChange={(e) => setEmail && setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label>Password <span>*</span></label>
                            <div className="input-wrap">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password || ''}
                                    onChange={(e) => setPassword && setPassword(e.target.value)}
                                    required
                                />
                                <button className="toggle-pass" onClick={() => setShowPassword(!showPassword)} type="button">
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {error}
                            </div>
                        )}

                        <div className="options-row">
                            <label className="remember">
                                <input
                                    type="checkbox"
                                    onClick={(e) => {
                                        if (e.currentTarget.checked) {
                                            const confirmed = window.confirm("Do you want to remember your login on this device?");
                                            if (!confirmed) {
                                                e.preventDefault();
                                            }
                                        }
                                    }}
                                />
                                <div className="custom-check"></div>
                                Remember me
                            </label>
                            <a href="#" className="forgot" onClick={(e) => {
                                e.preventDefault();
                                if (onForgotPassword) onForgotPassword();
                            }}>
                                Forgot password?
                            </a>
                        </div>

                        <button className="btn-signin" type="submit" disabled={loading}>
                            <div className="shimmer"></div>
                            <span className="btn-text">{loading ? 'Signing in...' : 'Sign in →'}</span>
                        </button>
                    </form>

                    <div className="divider"><span>or continue with</span></div>

                    <button className="sso-btn" type="button" onClick={() => handleGoogleLogin()}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <div className="security-badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Protected by enterprise-grade security
                    </div>
                    {wrongPortalUrl && wrongPortalLabel && (
                        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
                            Looking for the{' '}
                            <a href={wrongPortalUrl} style={{ color: 'var(--cyan, #06b6d4)', textDecoration: 'underline' }}>
                                {wrongPortalLabel}
                            </a>?
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
