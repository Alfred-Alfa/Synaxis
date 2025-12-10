import User from '../models/User.js';

const seedSuperAdmin = async () => {
    try {
        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;

        if (!email || !password) {
            console.log('⚠️ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env. Skipping initial seed.');
            return;
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log(`✅ Super Admin (${email}) exists in database. Verifying...`);
            // Optional: You could update the password here if you wanted to enforce the env password, 
            // but "verify from db" usually means just check it exists. 
            // The user asked: "if found in db verify from db everytime" -> implies Login flow handles verification.
            // "if not fetch from env and create" -> We do that here.
            return;
        }

        console.log(`🆕 Super Admin not found. Creating from environment variables...`);
        
        await User.create({
            email,
            password,
            role: 'SuperAdmin',
            isActive: true,
            isFirstLogin: false // Assume env-seeded admin is ready to go
        });

        console.log(`✅ Super Admin (${email}) created successfully.`);

    } catch (error) {
        console.error('❌ Error seeding Super Admin:', error.message);
    }
};

export default seedSuperAdmin;
