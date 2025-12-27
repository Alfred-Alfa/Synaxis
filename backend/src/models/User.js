import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt.js';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['SuperAdmin', 'Admin', 'Staff'],
            default: 'Staff',
        },
        staffRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: function () {
                return this.role === 'Staff';
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isFirstLogin: {
            type: Boolean,
            default: true,
        },
        passwordResetToken: {
            type: String,
        },
        passwordResetExpires: {
            type: Date,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
    return generateToken(this._id);
};

const User = mongoose.model('User', userSchema);

export default User;
