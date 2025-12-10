import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import seedSuperAdmin from './utils/initialSeed.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import routes
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import staffRoutes from './routes/staff.js';
import timeEntryRoutes from './routes/timeEntry.js';
import overtimeRoutes from './routes/overtime.js';
import leaveRoutes from './routes/leave.js';
import siteRoutes from './routes/site.js';
import payrollRoutes from './routes/payroll.js';
import settingsRoutes from './routes/settings.js';
import auditLogRoutes from './routes/auditLog.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notifications.js';

// Initialize Express
const app = express();

// Connect to database
connectDB().then(() => {
    // Run initial seed check
    seedSuperAdmin();
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5000',
        'https://hrms.elitecraftuk.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'HRMS API is running' });
});

// Serve frontend static files
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
    app.use(express.static(path.join(__dirname, '../public')));

    app.get('*', (req, res, next) => {
        // If request is for API, skip to 404 handler
        if (req.originalUrl.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
    });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export default app;
