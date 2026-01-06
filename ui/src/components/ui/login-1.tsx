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
        <div className="w-full group">
            {label && (
                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="w-full h-14 bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-5 py-2 outline-none transition-all duration-300 focus:border-blue-500 focus:bg-slate-800/50 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600"
                    placeholder={placeholder}
                />
                {icon && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
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
        <div className="min-h-screen w-full bg-[#020408] flex items-center justify-center p-4 md:p-8 lg:p-12">
            {/* Ambient Background Glows */}
            <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-6xl bg-slate-900/40 backdrop-blur-3xl border border-slate-800/50 rounded-[3rem] flex flex-col lg:flex-row overflow-hidden shadow-2xl min-h-[700px]">

                {/* Visual Side (LHS on Desktop) */}
                <div className="hidden lg:block lg:w-[45%] relative overflow-hidden bg-slate-950">
                    <img
                        src="https://images.pexels.com/photos/3182811/pexels-photo-3182811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-[2s] hover:scale-110"
                        alt="Workspace"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute bottom-16 left-16 right-16 space-y-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                            <span className="text-white text-3xl font-bold">W</span>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold text-white leading-tight">Empowering your <br /><span className="text-blue-500">Human Resources</span>.</h2>
                            <p className="text-slate-400 text-lg">Streamline monitoring, payroll, and team management with our enterprise-grade solution.</p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 text-sm font-medium tracking-widest uppercase">
                            <div className="h-[1px] w-8 bg-slate-700" />
                            <span>Webgeon HRMS v2.0</span>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center relative bg-slate-900/20">
                    {/* Progress Indicator (Subtle) */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                        <div
                            className={`h-full bg-blue-600 transition-all duration-500 ${loading ? 'w-2/3' : 'w-0'}`}
                        />
                    </div>

                    <div className="max-w-md mx-auto w-full space-y-12">
                        <div className="space-y-4">
                            <h1 className="text-5xl font-extrabold text-white tracking-tight">Sign In</h1>
                            <p className="text-slate-400 text-xl font-medium">Welcome back! Please enter your details.</p>
                        </div>

                        {error && (
                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 text-red-400 animate-in slide-in-from-top-4 duration-300">
                                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="font-bold">Authentication Error</p>
                                    <p className="text-sm opacity-90">{error}</p>
                                </div>
                            </div>
                        )}

                        <form className="space-y-8" onSubmit={onSubmit}>
                            <div className="space-y-6">
                                <AppInput
                                    label="Email Address"
                                    placeholder="johndoe@webgeon.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail && setEmail(e.target.value)}
                                    required
                                    icon={
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                                        <button type="button" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                                            Forgot password?
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group h-16 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Signing You In...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="pt-8 border-t border-slate-800/50">
                            <p className="text-slate-500 text-sm text-center font-medium">
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
