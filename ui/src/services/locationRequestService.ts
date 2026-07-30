import api from './api';

export const locationRequestService = {
    getMyLocations: async () => {
        return api.get('/location-requests/my-locations');
    },
    create: async (data: any) => {
        return api.post('/location-requests', data);
    },
    update: async (id: string, data: any) => {
        return api.put(`/location-requests/${id}`, data);
    },
    delete: async (id: string) => {
        return api.delete(`/location-requests/${id}`);
    },
    getAllAdmin: async () => {
        return api.get('/location-requests/admin/all');
    },
    approve: async (id: string) => {
        return api.post(`/location-requests/${id}/approve`, {});
    },
    reject: async (id: string, reason: string) => {
        return api.post(`/location-requests/${id}/reject`, { reason });
    }
};
