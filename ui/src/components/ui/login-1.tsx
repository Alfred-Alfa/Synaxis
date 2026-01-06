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
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-200 mb-2.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="w-full h-12 bg-white/5 border border-slate-700/50 text-white rounded-xl px-4 py-3 text-[15px] outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.07] placeholder:text-slate-500"
                    placeholder={placeholder}
                />
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
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
        <div className="min-h-screen w-full bg-[#0a0f1e] flex">
            {/* Left Branding Section - 40% */}
            <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden border-r border-slate-700/30">
                {/* Background Image */}
                <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1200&fit=crop&auto=format"
                    alt="Office workspace"
                    className="absolute inset-0 w-full h-full object-cover opacity-15"
                />
                {/* Dark Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-blue-950/95" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-16 w-full">
                    {/* Top section */}
                    <div className="space-y-10">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                                <span className="text-white text-lg font-bold">W</span>
                            </div>
                            <div>
                                <div className="text-white font-semibold text-lg">Webgeon</div>
                                <div className="text-slate-400 text-xs font-medium">HRMS Platform</div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-4 max-w-md">
                            <h2 className="text-white text-[32px] font-semibold leading-tight">
                                Enterprise workforce management
                            </h2>
                            <p className="text-slate-300 text-base leading-relaxed">
                                Streamline HR operations with our comprehensive platform designed for modern businesses.
                            </p>
                        </div>
                    </div>

                    {/* Bottom section */}
                    <div className="space-y-8">
                        {/* Features */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-slate-100 text-sm">Real-time analytics & reporting</span>
                            </div>
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-slate-100 text-sm">Employee lifecycle automation</span>
                            </div>
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-slate-100 text-sm">Enterprise-grade security</span>
                            </div>
                        </div>

                        {/* Version */}
                        <div className="pt-6 border-t border-slate-700/40">
                            <p className="text-slate-400 text-xs font-medium">Version 2.1.0 Enterprise Edition</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Login Section - 60% */}
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="w-full max-w-[480px]">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-10 flex items-center justify-center gap-3">
                        <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-lg font-bold">W</span>
                        </div>
                        <div>
                            <div className="text-white font-semibold text-lg">Webgeon HRMS</div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-10 text-center">
                        <h1 className="text-white text-[28px] font-semibold mb-3">
                            Sign in to your account
                        </h1>
                        <p className="text-slate-300 text-sm">
                            Enter your credentials to continue
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-7 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={onSubmit} className="space-y-6">
                        <AppInput
                            label="Email address"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail && setEmail(e.target.value)}
                            required
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            }
                        />

                        <div className="space-y-3">
                            <AppInput
                                label="Password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword && setPassword(e.target.value)}
                                required
                                icon={
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                }
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium text-[15px] rounded-xl transition-all duration-150 flex items-center justify-center gap-2 mt-8"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign in</span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-10 pt-8 border-t border-slate-700/30">
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-4">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Secured with 256-bit encryption</span>
                        </div>
                        <p className="text-slate-500 text-xs text-center">
                            © 2026 Webgeon Results Pvt Ltd. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginUI
