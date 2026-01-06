import * as React from 'react'
import {
    useState
} from 'react'

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
                <label className="block text-sm font-semibold text-slate-300 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="w-full h-12 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-4 py-2 outline-none transition-all duration-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-600 placeholder:text-slate-500"
                    placeholder={placeholder}
                />
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
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
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="min-h-screen w-full bg-[#05070a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

            <div
                className="w-full max-w-[1000px] bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] flex flex-col lg:flex-row overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Left Side: Form */}
                <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center relative">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-6 shadow-lg shadow-blue-600/20">
                            <span className="text-white text-2xl font-bold">W</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Welcome back</h1>
                        <p className="text-slate-400 mt-3 text-lg">Enter your details to access your account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

                        <div className="flex items-center justify-end">
                            <button type="button" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center lg:text-left text-slate-500 text-sm">
                        © 2026 Webgeon Results Pvt Ltd
                    </p>
                </div>

                {/* Right Side: Visual */}
                <div className="hidden lg:block w-[45%] relative bg-slate-900 overflow-hidden">
                    <img
                        src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        className={`w-full h-full object-cover opacity-60 transition-transform duration-[10s] ease-in-out ${isHovered ? 'scale-110' : 'scale-100'}`}
                        alt="Corporate"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl">
                            <p className="text-white text-lg font-medium italic opacity-90">
                                "The most powerful HR management system for modern teams."
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">W</div>
                                <div>
                                    <p className="text-white text-sm font-semibold">Webgeon HRMS</p>
                                    <p className="text-slate-400 text-xs text-uppercase tracking-wider">ENTERPRISE EDITION</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginUI
