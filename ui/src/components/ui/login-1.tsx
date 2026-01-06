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
                <label className="block text-sm font-semibold text-slate-300">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="w-full h-14 bg-slate-800/20 border border-slate-700/50 text-white rounded-xl px-5 py-2 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600"
                    placeholder={placeholder}
                />
                {icon && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500">
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
        <div className="min-h-screen w-full bg-[#05070a] flex items-center justify-center p-4">
            {/* Background Glow */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="w-full max-w-5xl bg-[#0f1216] border border-slate-800/60 rounded-[2rem] flex flex-col md:flex-row shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden min-h-[650px]">

                {/* Visual Side */}
                <div className="hidden md:flex md:w-[40%] bg-slate-950 p-12 flex-col justify-between relative overflow-hidden text-white border-r border-slate-800/60">
                    <img
                        src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale brightness-50"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-8">
                            <span className="text-white text-2xl font-bold">W</span>
                        </div>
                        <h2 className="text-3xl font-bold leading-tight">Master your <br />Workforce.</h2>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="h-1 w-12 bg-blue-600 rounded-full" />
                        <p className="text-slate-400 text-sm leading-relaxed">Webgeon HRMS provides the tools you need to build and manage a world-class team with ease.</p>
                        <p className="text-xs font-medium tracking-widest uppercase text-slate-500">v2.1.0 Enterprise</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-14 lg:p-20 flex flex-col justify-center bg-transparent">
                    <div className="max-w-md w-full mx-auto space-y-10">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold text-white tracking-tight">Sign In</h1>
                            <p className="text-slate-400 text-lg">Enter your details to access your account.</p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={onSubmit}>
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
                            <div className="space-y-3">
                                <AppInput
                                    label="Password"
                                    placeholder="••••••••••••"
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
                                <div className="flex justify-end">
                                    <button type="button" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-all">
                                        Forgot password?
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="pt-8 text-center">
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
