import api from './api';
import type { Payroll, ApiResponse } from '../types';

export const payrollService = {
    // Get all payroll records
    getAll: async (params?: {
        staffId?: string;
        startDate?: string;
        endDate?: string;
        month?: number;
        year?: number;
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
        taxPercentage?: number;
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

    // Get Payslip URL for viewing
    getPayslipUrl: async (id: string): Promise<string> => {
        const response = await api.get(`/payroll/${id}/payslip?view=inline`, {
            responseType: 'blob',
        });
        return URL.createObjectURL(response.data);
    },

    // Mark as paid
    markAsPaid: async (id: string): Promise<ApiResponse<Payroll>> => {
        const response = await api.post(`/payroll/${id}/mark-paid`);
        return response.data;
    },

    // Share payslip with employee
    shareWithEmployee: async (id: string): Promise<ApiResponse<Payroll>> => {
        const response = await api.post(`/payroll/${id}/share`);
        return response.data;
    },

    // Update payroll
    update: async (id: string, data: Partial<Payroll>): Promise<ApiResponse<Payroll>> => {
        const response = await api.put(`/payroll/${id}`, data);
        return response.data;
    },

    // Delete payroll
    delete: async (id: string): Promise<ApiResponse<void>> => {
        const response = await api.delete(`/payroll/${id}`);
        return response.data;
    },
};
