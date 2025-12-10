import api from './api';
import type { Site, ApiResponse } from '../types';

export const siteService = {
    // Get all sites
    getAll: async (params?: { status?: string }): Promise<ApiResponse<Site[]>> => {
        const response = await api.get('/sites', { params });
        return response.data;
    },

    // Get site by ID
    getById: async (id: string): Promise<ApiResponse<Site>> => {
        const response = await api.get(`/sites/${id}`);
        return response.data;
    },

    // Create site
    create: async (data: {
        name: string;
        location?: string;
        client?: string;
        otRate?: number;
    }): Promise<ApiResponse<Site>> => {
        const response = await api.post('/sites', data);
        return response.data;
    },

    // Update site
    update: async (id: string, data: Partial<Site>): Promise<ApiResponse<Site>> => {
        const response = await api.put(`/sites/${id}`, data);
        return response.data;
    },

    // Delete (deactivate) site
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/sites/${id}`);
        return response.data;
    },
};
