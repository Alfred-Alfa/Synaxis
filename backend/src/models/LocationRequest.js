import mongoose from 'mongoose';

const locationRequestSchema = new mongoose.Schema(
    {
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        locationName: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['Home', 'Work'],
            required: true,
        },
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        radius: {
            type: Number,
            default: 150,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        rejectionReason: String,
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: Date,
    },
    {
        timestamps: true,
    }
);

const LocationRequest = mongoose.model('LocationRequest', locationRequestSchema);

export default LocationRequest;
