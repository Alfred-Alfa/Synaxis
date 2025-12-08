import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Staff from '../src/models/Staff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanupUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const keepEmails = ['support@webgeon.com', 'it@elitecraftuk.com'];

        // 1. Find users to keep
        const usersToKeep = await User.find({ email: { $in: keepEmails } });
        console.log(`Found ${usersToKeep.length} users to keep:`, usersToKeep.map(u => u.email));

        if (usersToKeep.length === 0) {
            console.warn('WARNING: None of the protected emails were found!');
            // Optional: Ask for confirmation or abort if risky? 
            // We will proceed but be careful.
        }

        // 2. Delete all other Users
        const deleteUsersResult = await User.deleteMany({ email: { $nin: keepEmails } });
        console.log(`Deleted ${deleteUsersResult.deletedCount} users.`);

        // 3. Find Staff records associated with the kept users
        const keptStaffIds = usersToKeep
            .map(u => u.staffRef)
            .filter(id => id); // Filter out null/undefined

        // 4. Delete all Staff records NOT in keptStaffIds
        const deleteStaffResult = await Staff.deleteMany({ _id: { $nin: keptStaffIds } });
        console.log(`Deleted ${deleteStaffResult.deletedCount} staff records.`);

        console.log('Cleanup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

cleanupUsers();
