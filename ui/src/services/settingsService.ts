import api from './api';
import type { Settings, ApiResponse, AuditLog } from '../types';

export const settingsService = {
    // Get settings
    get: async (): Promise<ApiResponse<Settings>> => {
        const response = await api.get('/settings');
        return response.data;
    },

    // Update settings
    update: async (data: Partial<Settings>): Promise<ApiResponse<Settings>> => {
        const response = await api.put('/settings', data);
        return response.data;
    },

    // Upload logo
    uploadLogo: async (file: File): Promise<ApiResponse> => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await api.post('/settings/logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export const auditLogService = {
    // Get audit logs
    getAll: async (params?: {
        user?: string;
        action?: string;
        resource?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<AuditLog[]>> => {
        const response = await api.get('/audit-logs', { params });
        return response.data;
    },
};
