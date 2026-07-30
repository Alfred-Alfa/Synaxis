import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

await mongoose.connect(process.env.MONGODB_URI);
const companySettings = await mongoose.connection.db.collection('companyemailsettings').find({}).toArray();
console.log('CompanyEmailSettings in DB:', companySettings);
await mongoose.disconnect();
