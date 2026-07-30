import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (googleToken: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isStaff: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('hrms_token');
        const storedUser = localStorage.getItem('hrms_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const refreshUser = async () => {
        try {
            const response = await authService.me();
            if (response.user) {
                setUser(response.user);
                localStorage.setItem('hrms_user', JSON.stringify(response.user));
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });

            setToken(response.token);
            setUser(response.user);

            localStorage.setItem('hrms_token', response.token);
            localStorage.setItem('hrms_user', JSON.stringify(response.user));
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const loginWithGoogle = async (googleToken: string) => {
        try {
            const response = await authService.googleLogin(googleToken);
            setToken(response.token);
            setUser(response.user);

            localStorage.setItem('hrms_token', response.token);
            localStorage.setItem('hrms_user', JSON.stringify(response.user));
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Google Login failed');
        }
    };

    const logout = () => {
        authService.logout();
        setToken(null);
        setUser(null);
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
    };

    const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
    const isSuperAdmin = user?.role === 'SuperAdmin';
    const isStaff = user?.role === 'Staff';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                loginWithGoogle,
                logout,
                isAdmin,
                isSuperAdmin,
                isStaff,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
