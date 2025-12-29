import api from './api';
import type { AuthResponse, LoginCredentials, User } from '../types';

export const authService = {
    // Login
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    // Register
    register: async (email: string, password: string, role?: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', { email, password, role });
        return response.data;
    },

    // Get current user
    me: async (): Promise<{ success: boolean; user: User }> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // Logout
    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
    },

    // Update password
    updatePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.put('/auth/update-password', { currentPassword, newPassword });
        return response.data;
    },
};
