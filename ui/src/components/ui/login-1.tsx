import * as React from 'react'

interface InputProps {
    label?: string;
    placeholder?: string;
    icon?: React.ReactNode;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const AppInput = ({ label, placeholder, icon, type = "text", value, onChange, required }: InputProps) => {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="block text-sm font-medium text-slate-300">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="w-full h-12 bg-slate-900/40 border border-slate-700/40 text-white rounded-lg px-5 py-3 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-900/60 placeholder:text-slate-500 hover:border-slate-600/60"
                    placeholder={placeholder}
                />
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors duration-200 group-focus-within:text-blue-400">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

interface LoginUIProps {
    email?: string;
    setEmail?: (val: string) => void;
    password?: string;
    setPassword?: (val: string) => void;
    onSubmit?: (e: React.FormEvent) => void;
    loading?: boolean;
    error?: string;
}

const LoginUI = ({ email, setEmail, password, setPassword, onSubmit, loading, error }: LoginUIProps) => {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Enhanced Background Effects */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="fixed top-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-6xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-3xl flex flex-col md:flex-row shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden min-h-[680px] relative">

                {/* Visual Side - Branding Panel */}
                <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-12 flex-col justify-between relative overflow-hidden text-white border-r border-slate-800/60">
                    {/* Background Image with Reduced Opacity */}
                    <img
                        src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        className="absolute inset-0 w-full h-full object-cover opacity-[0.08] grayscale blur-[2px]"
                        alt="Background"
                    />
                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-blue-950/95" />

                    {/* Top Section - Logo & Title */}
                    <div className="relative z-10 space-y-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 mb-6 transition-transform duration-300 hover:scale-105">
                            <span className="text-white text-2xl font-bold">W</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold leading-tight mb-3">
                                Master your workforce<br />with Webgeon HRMS
                            </h2>
                            <p className="text-slate-400 text-base leading-relaxed">
                                Enterprise-grade HR management platform built for modern teams.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Section - Features & Version */}
                    <div className="relative z-10 space-y-6">
                        {/* Feature Highlights */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                <p className="text-slate-300 text-sm">Real-time workforce analytics and insights</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                <p className="text-slate-300 text-sm">Streamlined employee lifecycle management</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                <p className="text-slate-300 text-sm">Advanced compliance and security features</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-16 bg-gradient-to-r from-blue-600/50 to-transparent" />

                        {/* Version Info */}
                        <p className="text-xs font-medium tracking-wider uppercase text-slate-500">
                            Webgeon HRMS v2.1.0 Enterprise
                        </p>
                    </div>
                </div>

                {/* Form Side - Glass Card Container */}
                <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-gradient-to-br from-slate-900/20 to-slate-800/20 relative">
                    {/* Glass Card Wrapper */}
                    <div className="max-w-md w-full mx-auto">
                        {/* Glass Card Effect */}
                        <div className="bg-slate-900/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                            {/* Header Section */}
                            <div className="space-y-2 mb-8">
                                <h1 className="text-[27px] font-semibold text-white tracking-tight">
                                    Sign in to Webgeon HRMS
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    Enter your credentials to access your account
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Login Form */}
                            <form className="space-y-5" onSubmit={onSubmit}>
                                <AppInput
                                    label="Email Address"
                                    placeholder="name@company.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail && setEmail(e.target.value)}
                                    required
                                    icon={
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    }
                                />

                                <div className="space-y-2">
                                    <AppInput
                                        label="Password"
                                        placeholder="Enter your password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword && setPassword(e.target.value)}
                                        required
                                        icon={
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        }
                                    />
                                    {/* Forgot Password Link */}
                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            className="text-xs font-medium text-slate-400 hover:text-blue-400 transition-colors duration-200"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center gap-2.5"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Trust Signal */}
                            <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <p className="text-xs text-slate-500 font-medium">
                                    Secure login with 256-bit encryption
                                </p>
                            </div>
                        </div>

                        {/* Footer - Outside Glass Card */}
                        <div className="mt-8 text-center">
                            <p className="text-slate-500 text-xs">
                                © 2026 Webgeon Results Pvt Ltd. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginUI
