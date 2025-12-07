# HRMS Web Application

A comprehensive Human Resource Management System with attendance tracking, time entry approval, overtime management, payroll calculation, leave management, and detailed reporting.

## 🚀 Features

### Core Functionality
- **User Roles & Access Control**: Super Admin, Admin, and Staff roles with role-based permissions
- **Staff Management**: Complete employee lifecycle management with document uploads and hourly rate history
- **Time Entry System**: Manual time entry submission with approval workflow
- **Overtime Management**: OT request submission with multi-level rate configuration (staff > site > global)
- **Leave Management**: Leave application system with approval workflow and balance tracking
- **Sites/Projects**: Work site management with site-specific OT rates
- **Payroll System**: Automated payroll calculation with payslip PDF generation
- **Audit Logging**: Complete audit trail of all critical actions
- **Multi-timezone & Multi-currency Support**: Global-ready configuration

### Technology Stack

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt password hashing
- **File Upload**: Multer for document and attachment handling
- **PDF Generation**: PDFKit for payslips and reports
- **Excel Export**: xlsx library

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router (to be integrated)
- **State Management**: Context API
- **Styling**: CSS with modern design system

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd hrms
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your configuration:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: A secure random string for JWT signing
# - PORT: API server port (default: 5001)
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5001/api" > .env
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas cloud database
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The backend API will be available at `http://localhost:5001`  
The frontend will be available at `http://localhost:5173`

### First-Time Setup

1. **Create Super Admin Account**:
   - The first user registered will automatically become a Super Admin
   - Use the `/api/auth/register` endpoint or the registration form

2. **Configure Settings**:
   - Login with Super Admin account
   - Navigate to Settings page
   - Set timezone, currency, company details, and OT rates

3. **Add Staff**:
   - Navigate to Staff Management
   - Add employees with their hourly rates
   - Upload any required documents

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public (first user), then Super Admin |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/logout` | Logout user | Private |

### Staff Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/staff` | Get all staff | Admin |
| POST | `/api/staff` | Create staff | Admin |
| GET | `/api/staff/:id` | Get staff by ID | Admin, Staff (own) |
| PUT | `/api/staff/:id` | Update staff | Admin |
| DELETE | `/api/staff/:id` | Deactivate staff | Admin |
| POST | `/api/staff/:id/documents` | Upload documents | Admin |

### Time Entries

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/time-entries` | Get time entries | All (filtered by role) |
| POST | `/api/time-entries` | Submit time entry | Staff |
| GET | `/api/time-entries/:id` | Get entry by ID | All (filtered by role) |
| PUT | `/api/time-entries/:id` | Update entry (Pending only) | Staff (own) |
| DELETE | `/api/time-entries/:id` | Delete entry (Pending only) | Staff (own) |
| POST | `/api/time-entries/:id/approve` | Approve entry | Admin |
| POST | `/api/time-entries/:id/reject` | Reject entry | Admin |

### Overtime Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/overtime` | Get OT requests | All (filtered by role) |
| POST | `/api/overtime` | Submit OT request | Staff |
| GET | `/api/overtime/:id` | Get OT by ID | All (filtered by role) |
| PUT | `/api/overtime/:id` | Update OT (Pending only) | Staff (own) |
| DELETE | `/api/overtime/:id` | Delete OT (Pending only) | Staff (own) |
| POST | `/api/overtime/:id/approve` | Approve OT | Admin |
| POST | `/api/overtime/:id/reject` | Reject OT | Admin |

### Leave Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/leave` | Get leave applications | All (filtered by role) |
| POST | `/api/leave` | Submit leave application | Staff |
| GET | `/api/leave/:id` | Get leave by ID | All (filtered by role) |
| PUT | `/api/leave/:id` | Update leave (Pending only) | Staff (own) |
| DELETE | `/api/leave/:id` | Delete leave (Pending only) | Staff (own) |
| POST | `/api/leave/:id/approve` | Approve leave | Admin |
| POST | `/api/leave/:id/reject` | Reject leave | Admin |

### Sites/Projects

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/sites` | Get all sites | All |
| POST | `/api/sites` | Create site | Admin |
| GET | `/api/sites/:id` | Get site by ID | All |
| PUT | `/api/sites/:id` | Update site | Admin |
| DELETE | `/api/sites/:id` | Deactivate site | Admin |

### Payroll

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/payroll` | Get payroll records | All (filtered by role) |
| POST | `/api/payroll/generate` | Generate payroll | Admin |
| GET | `/api/payroll/:id` | Get payroll by ID | All (filtered by role) |
| GET | `/api/payroll/:id/payslip` | Download payslip PDF | All (filtered by role) |
| POST | `/api/payroll/:id/mark-paid` | Mark as paid | Admin |

### Settings & Audit Logs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/settings` | Get settings | All |
| PUT | `/api/settings` | Update settings | Admin |
| POST | `/api/settings/logo` | Upload logo | Admin |
| GET | `/api/audit-logs` | Get audit logs | Admin |

## 🔐 Security Features

- **Password Hashing**: BCrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Three-tier permission system
- **Session Timeout**: Configurable session expiration
- **Audit Logging**: Complete action tracking with IP addresses
- **File Upload Validation**: Type and size restrictions

## 📊 Database Schema

### Collections
- **users**: Authentication and user accounts
- **staff**: Employee information and records
- **sites**: Work sites/projects
- **timeentries**: Manual time entry submissions
- **overtimes**: Overtime requests
- **leaves**: Leave applications
- **payrolls**: Payroll records
- **auditlogs**: Audit trail
- **settings**: System configuration (singleton)

## 🤝 Contributing

This is a commissioned project. For any issues or feature requests, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🔄 Development Status

### Completed ✅
- Backend API (100%)
  - Authentication & Authorization
  - Staff Management
  - Time Entry System with Approval Workflow
  - Overtime Management with Multi-level Rate Configuration
  - Leave Management
  - Sites/Projects Management
  - Payroll Calculation Engine
  - Settings Management
  - Audit Logging
  - File Uploads
  - PDF Generation (Payslips)
  - Excel Export Foundation

### In Progress 🚧
- Frontend Application
  - UI Components
  - Authentication Pages
  - Admin Dashboard
  - Staff Portal
  - Reports & Analytics

### Planned 📋
- Advanced Reporting with Charts
- Email Notifications
- Dashboard Analytics
- Mobile App (Future)
- Biometric Integration (Future)
- 2FA/SSO (Future)

## 📞 Support

For support, please contact the development team or refer to the implementation plan document.
