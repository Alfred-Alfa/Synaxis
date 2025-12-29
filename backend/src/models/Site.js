import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Site name is required'],
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        client: {
            type: String,
            trim: true,
        },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        },
        radius: {
            type: Number,
            default: 100, // meters
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
        otRate: {
            type: Number,
            min: 0,
            // If set, this is used when staff-specific OT rate is not available
        },
    },
    {
        timestamps: true,
    }
);

const Site = mongoose.model('Site', siteSchema);

export default Site;
