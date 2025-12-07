import api from './api';
import type { TimeEntry, ApiResponse } from '../types';

export const timeEntryService = {
    // Get all time entries
    getAll: async (params?: {
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<ApiResponse<TimeEntry[]>> => {
        const response = await api.get('/time-entries', { params });
        return response.data;
    },

    // Get time entry by ID
    getById: async (id: string): Promise<ApiResponse<TimeEntry>> => {
        const response = await api.get(`/time-entries/${id}`);
        return response.data;
    },

    // Create time entry
    create: async (formData: FormData): Promise<ApiResponse<TimeEntry>> => {
        const response = await api.post('/time-entries', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update time entry
    update: async (id: string, data: Partial<TimeEntry>): Promise<ApiResponse<TimeEntry>> => {
        const response = await api.put(`/time-entries/${id}`, data);
        return response.data;
    },

    // Delete time entry
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/time-entries/${id}`);
        return response.data;
    },

    // Approve time entry
    approve: async (id: string, comment?: string): Promise<ApiResponse<TimeEntry>> => {
        const response = await api.post(`/time-entries/${id}/approve`, { comment });
        return response.data;
    },

    // Reject time entry
    reject: async (id: string, reason: string, comment?: string): Promise<ApiResponse<TimeEntry>> => {
        const response = await api.post(`/time-entries/${id}/reject`, {
            reason,
            comment,
        });
        return response.data;
    },
};
