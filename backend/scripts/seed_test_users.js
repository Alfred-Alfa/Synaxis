/**
 * Seed Script: Create Test Users
 * 
 * This script creates test credentials for:
 * - SuperAdmin
 * - Admin
 * - Staff (regular user)
 * 
 * Run with: node scripts/seed_test_users.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Staff from '../src/models/Staff.js';

// Load environment variables
dotenv.config();

// Test credentials
const TEST_USERS = {
    superadmin: {
        email: 'superadmin@hrms.test',
        password: 'SuperAdmin@123',
        role: 'SuperAdmin'
    },
    admin: {
        email: 'admin@hrms.test',
        password: 'Admin@123',
        role: 'Admin'
    },
    staff: {
        email: 'staff@hrms.test',
        password: 'Staff@123',
        role: 'Staff',
        staffDetails: {
            fullName: 'Test Staff User',
            email: 'staff@hrms.test',
            phone: '1234567890',
            hourlyRate: 250,
            designation: 'Test Employee',
            startDate: new Date(),
            employmentStatus: 'Active'
        }
    }
};

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

async function createTestUsers() {
    console.log('\n🔄 Creating test users...\n');

    const createdUsers = [];

    // 1. Create SuperAdmin
    try {
        let superadmin = await User.findOne({ email: TEST_USERS.superadmin.email });
        if (superadmin) {
            console.log('⚠️  SuperAdmin already exists, skipping...');
        } else {
            superadmin = await User.create({
                email: TEST_USERS.superadmin.email,
                password: TEST_USERS.superadmin.password,
                role: TEST_USERS.superadmin.role
            });
            console.log('✅ SuperAdmin created successfully');
        }
        createdUsers.push({
            role: 'SuperAdmin',
            email: TEST_USERS.superadmin.email,
            password: TEST_USERS.superadmin.password
        });
    } catch (error) {
        console.error('❌ Failed to create SuperAdmin:', error.message);
    }

    // 2. Create Admin
    try {
        let admin = await User.findOne({ email: TEST_USERS.admin.email });
        if (admin) {
            console.log('⚠️  Admin already exists, skipping...');
        } else {
            admin = await User.create({
                email: TEST_USERS.admin.email,
                password: TEST_USERS.admin.password,
                role: TEST_USERS.admin.role
            });
            console.log('✅ Admin created successfully');
        }
        createdUsers.push({
            role: 'Admin',
            email: TEST_USERS.admin.email,
            password: TEST_USERS.admin.password
        });
    } catch (error) {
        console.error('❌ Failed to create Admin:', error.message);
    }

    // 3. Create Staff (requires a Staff record first)
    try {
        let staffUser = await User.findOne({ email: TEST_USERS.staff.email });
        if (staffUser) {
            console.log('⚠️  Staff user already exists, skipping...');
        } else {
            // First, create the Staff record
            let staffRecord = await Staff.findOne({ email: TEST_USERS.staff.email });
            if (!staffRecord) {
                staffRecord = await Staff.create(TEST_USERS.staff.staffDetails);
                console.log('✅ Staff record created');
            }

            // Then create the user with reference to staff
            staffUser = await User.create({
                email: TEST_USERS.staff.email,
                password: TEST_USERS.staff.password,
                role: TEST_USERS.staff.role,
                staffRef: staffRecord._id
            });
            console.log('✅ Staff user created successfully');
        }
        createdUsers.push({
            role: 'Staff',
            email: TEST_USERS.staff.email,
            password: TEST_USERS.staff.password
        });
    } catch (error) {
        console.error('❌ Failed to create Staff user:', error.message);
    }

    return createdUsers;
}

function printCredentials(users) {
    console.log('\n' + '═'.repeat(60));
    console.log('📋 TEST CREDENTIALS');
    console.log('═'.repeat(60));

    users.forEach(user => {
        console.log(`\n🔐 ${user.role}`);
        console.log(`   Email:    ${user.email}`);
        console.log(`   Password: ${user.password}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('💡 Use these credentials to login at the application');
    console.log('═'.repeat(60) + '\n');
}

async function main() {
    console.log('🚀 HRMS Test User Seed Script');
    console.log('━'.repeat(40));

    await connectDB();
    const users = await createTestUsers();
    printCredentials(users);

    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
    console.log('✅ Seed script completed!\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
