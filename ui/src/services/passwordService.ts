import api from './api';

export const passwordService = {
    // Change password (for logged-in users, including first-time change)
    changePassword: async (currentPassword: string | null, newPassword: string) => {
        const response = await api.post('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    // Request password reset (sends email)
    requestReset: async (email: string) => {
        const response = await api.post('/auth/request-reset', { email });
        return response.data;
    },

    // Reset password with token
    resetPassword: async (token: string, newPassword: string) => {
        const response = await api.post(`/auth/reset-password/${token}`, {
            newPassword,
        });
        return response.data;
    },

    // Admin resets user password (sends reset email)
    adminResetPassword: async (staffId: string) => {
        const response = await api.post(`/staff/${staffId}/reset-password`);
        return response.data;
    },
};
