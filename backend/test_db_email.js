import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection;
    const settings = await db.collection('companyemailsettings').find().toArray();
    console.log("DB Email Settings:", JSON.stringify(settings, null, 2));
    process.exit(0);
}).catch(console.error);
