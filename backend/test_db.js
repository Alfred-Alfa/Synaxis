import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const latest = await db.collection('timeentries').find().sort({_id: -1}).limit(5).toArray();
    console.log(JSON.stringify(latest, null, 2));
    process.exit(0);
}).catch(console.error);
