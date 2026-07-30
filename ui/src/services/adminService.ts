import api from './api';
import type { ApiResponse } from '../types';

export interface AdminUser {
    _id: string;
    email: string;
    role: 'Admin' | 'SuperAdmin';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAdminData {
    email: string;
    password: string;
    role?: 'Admin' | 'SuperAdmin';
}

export const adminService = {
    // Get all admin users
    getAll: async (): Promise<ApiResponse<AdminUser[]>> => {
        const response = await api.get('/auth/admins');
        return response.data;
    },

    // Create a new admin user
    create: async (data: CreateAdminData): Promise<ApiResponse<AdminUser>> => {
        const response = await api.post('/auth/create-admin', data);
        return response.data;
    },

    // Delete an admin user
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/auth/admin/${id}`);
        return response.data;
    },
};
