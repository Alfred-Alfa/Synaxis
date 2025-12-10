import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') }); // Wait, in server.js I used ../../.env because server.js is in src/
// test-env.js is in backend/
// So relative to backend/test-env.js:
// ../.env is root.

// Let's mimic server.js exactly to be sure, so I should put this test script in src/ or adjust path.
// server.js is in src/
// path: path.join(__dirname, '../../.env') where __dirname is .../src
// returns .../root/.env

// If I put test-env.js in backend/
// __dirname is .../backend
// path.join(__dirname, '../.env') is .../root/.env

console.log('Testing Env Load from Root...');
console.log('PORT:', process.env.PORT);
console.log('DB:', process.env.MONGODB_URI ? 'Found' : 'Missing');
