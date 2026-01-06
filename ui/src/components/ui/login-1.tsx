import * as React from 'react'
import { settingsService } from '../../services/settingsService'

interface InputProps {
    label?: string;
    placeholder?: string;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const AppInput = ({ label, placeholder, type = "text", value, onChange, required }: InputProps) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-white mb-2">
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full h-12 bg-black/40 border border-white/20 text-white rounded-lg px-4 py-3 text-[15px] outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 placeholder:text-white/40"
                placeholder={placeholder}
            />
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
    const [companyLogo, setCompanyLogo] = React.useState<string>('')
    const [companyName, setCompanyName] = React.useState<string>('Webgeon HRMS')

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsService.get()
                if (response.success && response.data) {
                    if (response.data.companyLogo) {
                        setCompanyLogo(response.data.companyLogo)
                    }
                    if (response.data.companyName) {
                        setCompanyName(response.data.companyName)
                    }
                }
            } catch (error) {
                console.log('Using default branding')
            }
        }
        fetchSettings()
    }, [])

    return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-12 flex flex-col items-center">
                    {companyLogo ? (
                        <img
                            src={companyLogo}
                            alt={companyName}
                            className="h-12 w-auto mb-4"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-white text-xl font-bold">
                                {companyName.charAt(0)}
                            </span>
                        </div>
                    )}
                    <h2 className="text-white text-lg font-semibold">{companyName}</h2>
                </div>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-white text-2xl font-semibold mb-2">
                        Sign in
                    </h1>
                    <p className="text-white/60 text-sm">
                        Enter your credentials to continue
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={onSubmit} className="space-y-5">
                    <AppInput
                        label="Email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail && setEmail(e.target.value)}
                        required
                    />

                    <div>
                        <AppInput
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword && setPassword(e.target.value)}
                            required
                        />
                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium text-[15px] rounded-lg transition-all duration-150 flex items-center justify-center gap-2 mt-8"
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
                <div className="mt-10 pt-6 border-t border-white/10">
                    <p className="text-white/40 text-xs text-center">
                        © 2026 {companyName}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginUI
