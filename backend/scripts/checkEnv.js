import dotenv from 'dotenv';
import fs from 'fs';

try {
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    console.log('Keys in .env:', Object.keys(envConfig));
} catch (e) {
    console.log('Error reading .env:', e.message);
}
