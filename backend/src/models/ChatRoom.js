import mongoose from 'mongoose';

/**
 * ChatRoom Model
 * Isolated chat module - does not modify existing HRMS tables
 */
const chatRoomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: function () {
                return this.type === 'group';
            },
            trim: true,
        },
        type: {
            type: String,
            enum: ['direct', 'group'],
            required: true,
            default: 'direct',
        },
        // Array of User IDs participating in this chat
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        // Admin(s) of the group (only for group chats)
        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        // Last message for chat list preview
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        lastMessageAt: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
chatRoomSchema.index({ members: 1 });
chatRoomSchema.index({ type: 1, members: 1 });

// Method to check if user is a member
chatRoomSchema.methods.isMember = function (userId) {
    return this.members.some(memberId => memberId.toString() === userId.toString());
};

// Method to check if user is admin (for group chats)
chatRoomSchema.methods.isAdmin = function (userId) {
    return this.admins.some(adminId => adminId.toString() === userId.toString());
};

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;
