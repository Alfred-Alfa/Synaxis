import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/database.js';
import seedSuperAdmin from '../src/utils/initialSeed.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
    try {
        await connectDB();
        console.log('--- Connected to DB ---');
        
        // 1. Run Seeder
        await seedSuperAdmin();

        // 2. Verify
        const email = process.env.SUPER_ADMIN_EMAIL;
        const user = await User.findOne({ email });

        if (user) {
            console.log(`\n🎉 VERIFICATION SUCCESS: User ${user.email} exists in DB.`);
            console.log(`   Role: ${user.role}`);
            console.log(`   ID: ${user._id}`);
        } else {
            console.error('\n❌ VERIFICATION FAILED: User not found after seeding.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
