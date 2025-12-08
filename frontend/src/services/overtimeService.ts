import api from './api';
import type { Overtime, ApiResponse } from '../types';

export const overtimeService = {
    // Get all overtime requests
    getAll: async (params?: {
        status?: string;
        startDate?: string;
        endDate?: string;
        mode?: string;
    }): Promise<ApiResponse<Overtime[]>> => {
        const response = await api.get('/overtime', { params });
        return response.data;
    },

    // Get overtime by ID
    getById: async (id: string): Promise<ApiResponse<Overtime>> => {
        const response = await api.get(`/overtime/${id}`);
        return response.data;
    },

    // Create overtime request
    create: async (formData: FormData): Promise<ApiResponse<Overtime>> => {
        const response = await api.post('/overtime', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update overtime
    update: async (id: string, data: Partial<Overtime>): Promise<ApiResponse<Overtime>> => {
        const response = await api.put(`/overtime/${id}`, data);
        return response.data;
    },

    // Delete overtime
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/overtime/${id}`);
        return response.data;
    },

    // Approve overtime
    approve: async (id: string, comment?: string): Promise<ApiResponse<Overtime>> => {
        const response = await api.post(`/overtime/${id}/approve`, { comment });
        return response.data;
    },

    // Reject overtime
    reject: async (id: string, reason: string, comment?: string): Promise<ApiResponse<Overtime>> => {
        const response = await api.post(`/overtime/${id}/reject`, {
            reason,
            comment,
        });
        return response.data;
    },
};
