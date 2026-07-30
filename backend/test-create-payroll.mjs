import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Payroll from './src/models/Payroll.js';
import Staff from './src/models/Staff.js';
import User from './src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);

const staffEmails = [
  'alfredfrancis0012@gmail.com',
  'alfredfrancis2004@gmail.com'
];

// Let's find or create a staff and user
let user = await User.findOne({ email: staffEmails[0] });
if (!user) user = await User.findOne({ role: 'Staff' });

if (user && user.staffRef) {
  const staff = await Staff.findById(user.staffRef);
  console.log(`Testing with staff: ${staff.fullName} (${user.email})`);
  
  // Create a fake payroll
  const payroll = await Payroll.create({
    staffId: staff._id,
    periodStart: new Date('2026-02-01'),
    periodEnd: new Date('2026-02-28'),
    normalHours: 160,
    normalPay: 1600,
    grossPay: 1600,
    totalPay: 1400,
    generatedBy: user._id, // random admin
    isSharedWithEmployee: false
  });

  console.log('Created fake payroll _id:', payroll._id);
} else {
  console.log('No suitable user/staff found for testing');
}

await mongoose.disconnect();
