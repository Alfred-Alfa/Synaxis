import mongoose from 'mongoose';
import Staff from '../models/Staff.js';
import User from '../models/User.js';

// This script ensures all Staff members have corresponding User accounts
export const syncStaffUsers = async () => {
    try {
        console.log('🔄 Starting Staff-User sync...');

        const allStaff = await Staff.find({});
        console.log(`Found ${allStaff.length} staff members`);

        let created = 0;
        let existing = 0;
        let skipped = 0;
        const errors = [];

        for (const staff of allStaff) {
            try {
                // Check if User exists by staffRef OR email
                const existingUser = await User.findOne({
                    $or: [
                        { staffRef: staff._id },
                        { email: staff.email }
                    ]
                });

                if (existingUser) {
                    // User exists, update staffRef if missing
                    if (!existingUser.staffRef) {
                        existingUser.staffRef = staff._id;
                        await existingUser.save();
                        console.log(`✅ Updated staffRef for ${staff.fullName} (${staff.email})`);
                    }
                    existing++;
                } else {
                    // Create new User account
                    console.log(`➕ Creating User for ${staff.fullName} (${staff.email})`);
                    await User.create({
                        email: staff.email,
                        password: 'password123', // Default password
                        role: 'Staff', // Default role
                        staffRef: staff._id,
                    });
                    created++;
                }
            } catch (err) {
                console.error(`❌ Error processing ${staff.fullName}:`, err.message);
                errors.push({ staff: staff.fullName, error: err.message });
                skipped++;
            }
        }

        console.log(`✅ Sync complete:`);
        console.log(`   - Existing users: ${existing}`);
        console.log(`   - Created users: ${created}`);
        console.log(`   - Skipped (errors): ${skipped}`);

        return { created, existing, skipped, total: allStaff.length, errors };
    } catch (error) {
        console.error('❌ Error syncing staff-users:', error);
        throw error;
    }
};
