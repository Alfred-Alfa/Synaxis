import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendPasswordResetEmail } from './src/services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log("Sending password reset email test...");
    const res = await sendPasswordResetEmail('alfredfrancis2004@gmail.com', 'test-token-1234', 'Alfred', 'http://localhost:3000');
    
    console.log("Result:", res);
    process.exit(0);
}

test().catch(console.error);
