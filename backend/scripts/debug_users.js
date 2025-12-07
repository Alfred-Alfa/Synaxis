/**
 * Debug Script: Check User Credentials
 * 
 * This script checks if users exist and tests password matching
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

// Load environment variables
dotenv.config();

async function connectDB() {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
}

async function checkUsers() {
    console.log('\n🔍 Checking users in database...\n');

    const testCredentials = [
        { email: 'superadmin@hrms.test', password: 'SuperAdmin@123' },
        { email: 'admin@hrms.test', password: 'Admin@123' },
        { email: 'staff@hrms.test', password: 'Staff@123' }
    ];

    for (const cred of testCredentials) {
        console.log(`\n📧 Checking: ${cred.email}`);
        console.log('─'.repeat(50));

        const user = await User.findOne({ email: cred.email }).select('+password');

        if (!user) {
            console.log('❌ User NOT FOUND in database');
            continue;
        }

        console.log('✅ User EXISTS in database');
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);

        // Test password matching
        const isMatch = await user.matchPassword(cred.password);
        console.log(`   Password Match: ${isMatch ? '✅ YES' : '❌ NO'}`);

        if (!isMatch) {
            console.log('   ⚠️  PASSWORD DOES NOT MATCH!');
            console.log(`   Expected password: ${cred.password}`);
        }
    }
}

async function main() {
    console.log('🔍 HRMS User Credential Debug Script');
    console.log('━'.repeat(50));

    await connectDB();
    await checkUsers();

    await mongoose.disconnect();
    console.log('\n✅ MongoDB Disconnected');
    console.log('✅ Debug script completed!\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
