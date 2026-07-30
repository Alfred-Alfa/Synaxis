import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['important', 'normal'],
            default: 'normal',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    }
);

// Index for getting recent active announcements quickly
announcementSchema.index({ isActive: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
