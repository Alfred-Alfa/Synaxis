import mongoose from 'mongoose';

/**
 * Message Model
 * Isolated chat module - stores all chat messages
 */
const messageSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatRoom',
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        senderName: {
            type: String,
            required: true,
        },
        messageText: {
            type: String,
            required: true,
            trim: true,
        },
        messageType: {
            type: String,
            enum: ['text', 'system'],
            default: 'text',
        },
        // Read receipts - array of user IDs who have read this message
        readBy: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            readAt: {
                type: Date,
                default: Date.now,
            },
        }],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        attachments: [{
            url: String,
            name: String,
            type: String,
            size: Number
        }]
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
