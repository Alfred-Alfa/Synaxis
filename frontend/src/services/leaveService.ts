import api from './api';
import type { Leave, ApiResponse } from '../types';

export const leaveService = {
    // Get all leave applications
    getAll: async (params?: {
        status?: string;
        leaveType?: string;
    }): Promise<ApiResponse<Leave[]>> => {
        const response = await api.get('/leave', { params });
        return response.data;
    },

    // Get leave by ID
    getById: async (id: string): Promise<ApiResponse<Leave>> => {
        const response = await api.get(`/leave/${id}`);
        return response.data;
    },

    // Create leave application
    create: async (formData: FormData): Promise<ApiResponse<Leave>> => {
        const response = await api.post('/leave', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update leave
    update: async (id: string, data: Partial<Leave>): Promise<ApiResponse<Leave>> => {
        const response = await api.put(`/leave/${id}`, data);
        return response.data;
    },

    // Delete leave
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/leave/${id}`);
        return response.data;
    },

    // Approve leave
    approve: async (id: string): Promise<ApiResponse<Leave>> => {
        const response = await api.post(`/leave/${id}/approve`);
        return response.data;
    },

    // Reject leave
    reject: async (id: string, comment: string): Promise<ApiResponse<Leave>> => {
        const response = await api.post(`/leave/${id}/reject`, {
            comment,
        });
        return response.data;
    },
};
