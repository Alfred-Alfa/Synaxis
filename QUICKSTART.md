# Quick Start Guide

## Prerequisites
- Node.js v18+ installed
- MongoDB running locally or MongoDB Atlas connection string

## Setup Instructions

### Step 1: Set up environment variables

**Backend (.env file):**
```bash
cd backend
# Create .env file (copy from .env.example)
echo "NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hrms
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
SESSION_TIMEOUT=30m
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880" > .env
```

**UI (.env file):**
```bash
cd ui
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### Step 2: Install dependencies

```bash
# Backend
cd backend
npm install

# UI (in a new terminal)
cd ui
npm install
```

### Step 3: Start MongoDB

```bash
# If using Homebrew on macOS
brew services start mongodb-community

# Or if MongoDB is already installed
mongod
```

### Step 4: Start the applications

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev

# You should see:
# MongoDB Connected: localhost
# Server running in development mode on port 5000
```

**Terminal 2 - UI:**
```bash
cd ui
npm run dev

# You should see:
# Local: http://localhost:5173/
```

### Step 5: Access the application

1. Open your browser and go to `http://localhost:5173`
2. You'll see the login page
3. **First time setup**: Click register or use the API to create the first user (will become Super Admin)

## Creating the First Admin User

### Option 1: Using cURL
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "admin123"
  }'
```

### Option 2: Using the login page
- The first registered user automatically becomes a Super Admin
- Just enter your email and password on the login form

## Testing the Application

1. **Login** with your admin credentials
2. You'll be redirected to the **Admin Dashboard**
3. Navigate using the sidebar to:
   - **Staff Management**: Add employees
   - **Sites/Projects**: Create work locations
   - **Settings**: Configure timezone, currency, OT rates
4. **Create a staff member** to test the staff portal
5. **Logout** and login with staff credentials to see the staff dashboard

## Default Credentials (if using test setup)
- **Admin**: admin@company.com / admin123
- **Staff**: Create via Admin panel

## Troubleshooting

### Backend not starting
- Check if MongoDB is running: `mongosh` or `mongo`
- Check if port 5000 is available
- Verify `.env` file exists with correct values

### UI not connecting to backend
- Check if backend is running on port 5000
- Verify `VITE_API_URL` in UI `.env`
- Check browser console for CORS errors

### Database connection errors
- Confirm MongoDB is running
- Check `MONGODB_URI` in backend `.env`
- Try: `mongosh mongodb://localhost:27017/hrms`

## What's Working

✅ **Authentication**: Login/logout, JWT tokens, role-based access  
✅ **Protected Routes**: Admin and staff portals with access control  
✅ **Layout**: Responsive Navbar and Sidebar navigation  
✅ **Dashboards**: Admin and Staff dashboards with placeholders  
✅ **Backend API**: All 9 modules fully functional (see backend walkthrough)

## Next Steps

The UI currently has:
- ✅ Authentication system
- ✅ Layout and navigation
- ✅ Dashboard pages (placeholders)
- ⏳ Module pages need full implementation (staff forms, time entries, etc.)

Continue development by:
1. Implementing staff management forms
2. Building time entry submission and approval pages
3. Creating overtime and leave application forms
4. Developing payroll generation interface
5. Adding data visualization and charts
