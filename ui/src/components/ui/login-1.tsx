import * as React from 'react'
import {
    useState
} from 'react'

interface InputProps {
    label?: string;
    placeholder?: string;
    icon?: React.ReactNode;
    [key: string]: any;
}

const AppInput = (props: InputProps) => {
    const { label, placeholder, icon, ...rest } = props;
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div className="w-full min-w-[200px] relative">
            {label &&
                <label className='block mb-2 text-sm font-medium text-[var(--color-text-primary)]'>
                    {label}
                </label>
            }
            <div className="relative w-full group">
                <input
                    className="peer relative z-10 h-12 w-full rounded-xl bg-[var(--color-surface)]/50 px-4 font-normal text-[var(--color-text-primary)] outline-none transition-all duration-300 ease-in-out focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-text-primary)]/20 placeholder:text-[var(--color-text-secondary)]/50 border border-white/5 shadow-inner"
                    placeholder={placeholder}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    {...rest}
                />
                {isHovering && (
                    <>
                        <div
                            className="absolute pointer-events-none top-0 left-0 right-0 h-[1px] z-20 rounded-t-xl overflow-hidden opacity-50"
                            style={{
                                background: `radial-gradient(40px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 80%)`,
                            }}
                        />
                        <div
                            className="absolute pointer-events-none bottom-0 left-0 right-0 h-[1px] z-20 rounded-b-xl overflow-hidden opacity-50"
                            style={{
                                background: `radial-gradient(40px circle at ${mousePosition.x}px 1px, var(--color-text-primary) 0%, transparent 80%)`,
                            }}
                        />
                    </>
                )}
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)]">
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
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const leftSection = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - leftSection.left,
            y: e.clientY - leftSection.top
        });
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    return (
        <div className="h-screen w-[100%] bg-[var(--color-bg)] flex items-center justify-center p-4">
            <div className='card w-[80%] lg:w-[70%] md:w-[65%] flex justify-between h-[600px] bg-[var(--color-surface)]/20 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl'>
                <div
                    className='w-full lg:w-1/2 px-6 lg:px-16 left h-full relative flex flex-col justify-center'
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}>
                    <div
                        className={`absolute pointer-events-none w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[100px] transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            transform: `translate(${mousePosition.x - 300}px, ${mousePosition.y - 300}px)`,
                            transition: 'transform 0.15s ease-out'
                        }}
                    />
                    <div className="form-container relative z-10">
                        <div className="text-center mb-10">
                            <h1 className='text-4xl font-bold tracking-tight' style={{ color: 'var(--color-heading)' }}>Welcome back</h1>
                            <p className="text-[var(--color-text-secondary)] mt-2">Please enter your credentials</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm py-3 px-4 rounded-xl mb-6 text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <form className='grid gap-6' onSubmit={onSubmit}>
                            <div className='grid gap-4'>
                                <AppInput
                                    placeholder="Email address"
                                    type="email"
                                    value={email}
                                    onChange={(e: any) => setEmail && setEmail(e.target.value)}
                                    required
                                />
                                <AppInput
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e: any) => setPassword && setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end">
                                <a href="#" className='text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors'>Forgot your password?</a>
                            </div>

                            <div className='mt-2'>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full group/button relative h-12 inline-flex justify-center items-center overflow-hidden rounded-xl bg-[var(--color-bg-2)] text-sm font-semibold text-[var(--color-bg)] transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-15deg)_translateX(-100%)] group-hover/button:duration-700 group-hover/button:[transform:skew(-15deg)_translateX(100%)]">
                                        <div className="relative h-full w-12 bg-white/30" />
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className='hidden lg:block w-1/2 right h-full overflow-hidden relative'>
                    <img
                        src='https://images.pexels.com/photos/7102037/pexels-photo-7102037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                        alt="Background"
                        className="w-full h-full object-cover opacity-40 hover:scale-105 transition-transform duration-[5s] ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[var(--color-surface)]/80" />
                </div>
            </div>
        </div>
    )
}

export default LoginUI
