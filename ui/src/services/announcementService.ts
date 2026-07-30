import api from './api';

export interface Announcement {
    _id: string;
    title: string;
    message: string;
    type: 'important' | 'normal';
    createdBy: {
        _id: string;
        email: string;
        staffRef?: {
            name: string;
            position: string;
        };
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const announcementService = {
    getAll: async (): Promise<Announcement[]> => {
        const response = await api.get('/announcements');
        return response.data;
    },

    getById: async (id: string): Promise<Announcement> => {
        const response = await api.get(`/announcements/${id}`);
        return response.data;
    },

    create: async (data: Partial<Announcement>): Promise<Announcement> => {
        const response = await api.post('/announcements', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
        const response = await api.put(`/announcements/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/announcements/${id}`);
        return response.data;
    }
};
