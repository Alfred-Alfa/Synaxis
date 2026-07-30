import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

await mongoose.connect(process.env.MONGODB_URI);
const users = await mongoose.connection.db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
console.log('Users in DB:');
users.forEach(u => console.log(`  ${u.email} (${u.role})`));
await mongoose.disconnect();
