/**
 * Debug Script: Test Login Flow
 * 
 * This script simulates the exact login flow to identify the issue
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

async function testLoginFlow() {
    const email = 'superadmin@hrms.test';
    const password = 'SuperAdmin@123';

    console.log('\n🔍 Testing Login Flow');
    console.log('━'.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('');

    // Step 1: Find user WITHOUT select
    console.log('Step 1: Finding user WITHOUT .select("+password")');
    const userWithout = await User.findOne({ email });
    console.log('   User found:', !!userWithout);
    console.log('   Has password field:', !!userWithout?.password);
    if (userWithout?.password) {
        console.log('   Password value:', userWithout.password.substring(0, 20) + '...');
    }

    // Step 2: Find user WITH select
    console.log('\nStep 2: Finding user WITH .select("+password")');
    const userWith = await User.findOne({ email }).select('+password');
    console.log('   User found:', !!userWith);
    console.log('   Has password field:', !!userWith?.password);
    if (userWith?.password) {
        console.log('   Password value:', userWith.password.substring(0, 20) + '...');
    }

    // Step 3: Test password matching
    if (userWith) {
        console.log('\nStep 3: Testing password matching');
        const isMatch = await userWith.matchPassword(password);
        console.log('   Password matches:', isMatch ? '✅ YES' : '❌ NO');

        // Step 4: Test with wrong password
        console.log('\nStep 4: Testing with wrong password');
        const wrongMatch = await userWith.matchPassword('WrongPassword123');
        console.log('   Wrong password matches:', wrongMatch ? '❌ YES (BAD!)' : '✅ NO (GOOD)');
    }

    // Step 5: Check if password field has select: false
    console.log('\nStep 5: Checking User schema');
    const schema = User.schema.paths.password;
    console.log('   Password field options:', {
        required: schema.options.required,
        select: schema.options.select,
        minlength: schema.options.minlength
    });
}

async function main() {
    console.log('🔍 HRMS Login Flow Debug Script');
    console.log('━'.repeat(50));

    await connectDB();
    await testLoginFlow();

    await mongoose.disconnect();
    console.log('\n✅ MongoDB Disconnected');
    console.log('✅ Debug script completed!\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
