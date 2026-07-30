import api from './api';
import type { Staff, ApiResponse } from '../types';

export const staffService = {
    // Get all staff
    getAll: async (params?: { status?: string }): Promise<ApiResponse<Staff[]>> => {
        const response = await api.get('/staff', { params });
        return response.data;
    },

    // Get staff by ID
    getById: async (id: string): Promise<ApiResponse<Staff>> => {
        const response = await api.get(`/staff/${id}`);
        return response.data;
    },

    // Create staff
    create: async (data: any): Promise<ApiResponse<Staff>> => {
        const response = await api.post('/staff', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return response.data;
    },

    // Update staff
    update: async (id: string, data: any): Promise<ApiResponse<Staff>> => {
        const response = await api.put(`/staff/${id}`, data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return response.data;
    },

    // Delete (deactivate) staff
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/staff/${id}`);
        return response.data;
    },

    // Reactivate staff
    reactivate: async (id: string): Promise<ApiResponse> => {
        const response = await api.put(`/staff/${id}/reactivate`, {});
        return response.data;
    },

    // Upload document
    uploadDocument: async (id: string, file: File, documentName: string): Promise<ApiResponse> => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentName', documentName);

        const response = await api.post(`/staff/${id}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Sync Staff-User relationships
    syncUsers: async (): Promise<ApiResponse> => {
        const response = await api.post('/staff/sync-users');
        return response.data;
    },
};
