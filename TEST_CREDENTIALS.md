# Test Credentials for HRMS

This document contains test credentials for different user roles in the HRMS application.

## 🔐 Test User Accounts

### SuperAdmin
- **Email:** `superadmin@hrms.test`
- **Password:** `SuperAdmin@123`
- **Role:** SuperAdmin
- **Permissions:** Full system access, can manage all users and settings

### Admin
- **Email:** `admin@hrms.test`
- **Password:** `Admin@123`
- **Role:** Admin
- **Permissions:** Administrative access, can manage staff and operations

### Staff (Regular User)
- **Email:** `staff@hrms.test`
- **Password:** `Staff@123`
- **Role:** Staff
- **Permissions:** Limited access, employee portal features
- **Details:**
  - Full Name: Test Staff User
  - Phone: 1234567890
  - Hourly Rate: ₹250/hour
  - Designation: Test Employee
  - Status: Active

## 📝 Notes

- These credentials are for **testing purposes only**
- Do not use these credentials in production environments
- All passwords follow the format: `[Role]@123`
- Staff users are linked to actual staff records in the database

## 🔄 Regenerating Test Users

To recreate or reset test users, run:

```bash
cd backend
node scripts/seed_test_users.js
```

**Important:** The script will automatically use the same database as your backend (configured in `backend/.env` via `MONGODB_URI` or `MONGO_URI`). This ensures test users are created in the correct database.

The script will:
- Connect to the database specified in your environment variables
- Skip existing users (won't create duplicates)
- Create missing users
- Display all test credentials upon completion
- Show which database it connected to

## 🔒 Security Recommendations

For production:
1. Use strong, unique passwords
2. Enable two-factor authentication
3. Implement password rotation policies
4. Remove or disable test accounts
5. Use environment-specific credentials
