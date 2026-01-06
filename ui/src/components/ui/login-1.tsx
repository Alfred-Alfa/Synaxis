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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full h-10 bg-white border border-gray-300 text-gray-900 rounded px-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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
    onForgotPassword?: () => void;
}

const LoginUI = ({ email, setEmail, password, setPassword, onSubmit, loading, error, onForgotPassword }: LoginUIProps) => {
    const [companyLogo, setCompanyLogo] = React.useState<string>('')
    const [companyName, setCompanyName] = React.useState<string>('HRMS')
    const [isLoading, setIsLoading] = React.useState<boolean>(true)

    React.useEffect(() => {
        let mounted = true

        const fetchSettings = async () => {
            try {
                const response = await settingsService.get()
                if (mounted && response.success && response.data) {
                    if (response.data.companyLogo) {
                        setCompanyLogo(response.data.companyLogo)
                    }
                    if (response.data.companyName) {
                        setCompanyName(response.data.companyName)
                    }
                }
            } catch (error) {
                console.log('Using default branding')
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        fetchSettings()

        return () => {
            mounted = false
        }
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="text-gray-400 text-sm">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-[380px]">
                {/* Login Card */}
                <div className="bg-white rounded border border-gray-200 shadow-sm px-8 py-10">
                    {/* Logo */}
                    <div className="mb-8">
                        {companyLogo ? (
                            <img
                                src={companyLogo}
                                alt={companyName}
                                className="h-8 mb-6"
                            />
                        ) : (
                            <div className="text-gray-900 text-lg font-semibold mb-6">
                                {companyName}
                            </div>
                        )}
                        <h1 className="text-gray-900 text-xl font-semibold">
                            Sign in
                        </h1>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={onSubmit} className="space-y-4">
                        <AppInput
                            label="Email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail && setEmail(e.target.value)}
                            required
                        />

                        <AppInput
                            label="Password"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword && setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded mt-2"
                        >
                            {loading ? 'Signing in...' : 'Login'}
                        </button>

                        <div className="pt-1 text-center">
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-xs text-gray-600 hover:text-gray-900"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginUI
