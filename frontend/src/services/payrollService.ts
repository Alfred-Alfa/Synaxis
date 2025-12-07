import api from './api';
import type { Payroll, ApiResponse } from '../types';

export const payrollService = {
    // Get all payroll records
    getAll: async (params?: {
        staffId?: string;
    }): Promise<ApiResponse<Payroll[]>> => {
        const response = await api.get('/payroll', { params });
        return response.data;
    },

    // Get payroll by ID
    getById: async (id: string): Promise<ApiResponse<Payroll>> => {
        const response = await api.get(`/payroll/${id}`);
        return response.data;
    },

    // Generate payroll
    generate: async (data: {
        staffId: string;
        periodStart: string;
        periodEnd: string;
        notes?: string;
    }): Promise<ApiResponse<Payroll>> => {
        const response = await api.post('/payroll/generate', data);
        return response.data;
    },

    // Download payslip
    downloadPayslip: async (id: string): Promise<Blob> => {
        const response = await api.get(`/payroll/${id}/payslip`, {
            responseType: 'blob',
        });
        return response.data;
    },

    // Mark as paid
    markAsPaid: async (id: string): Promise<ApiResponse<Payroll>> => {
        const response = await api.post(`/payroll/${id}/mark-paid`);
        return response.data;
    },
};
