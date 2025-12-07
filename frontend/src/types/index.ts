// User and Authentication Types
export interface User {
    id: string;
    email: string;
    role: 'SuperAdmin' | 'Admin' | 'Staff';
    staffRef?: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// Staff Types
export interface Staff {
    _id: string;
    fullName: string;
    email: string;
    employeeId?: string;
    phone?: string;
    hourlyRate: number;
    hourlyRateHistory: {
        rate: number;
        effectiveDate: string;
        changedBy?: string;
    }[];
    address?: string;
    startDate?: string;
    designation?: string;
    documents: {
        name: string;
        path: string;
        uploadDate: string;
    }[];
    bankDetails?: {
        accountNumber?: string;
        bankName?: string;
        ifscCode?: string;
        accountHolderName?: string;
    };
    employmentStatus: 'Active' | 'Inactive';
    otRate?: number;
    createdAt: string;
    updatedAt: string;
}

// Site Types
export interface Site {
    _id: string;
    name: string;
    location?: string;
    client?: string;
    status: 'Active' | 'Inactive';
    otRate?: number;
    createdAt: string;
    updatedAt: string;
}

// Time Entry Types
export interface TimeEntry {
    _id: string;
    staffId: string | Staff;
    date: string;
    startTime?: string;
    endTime?: string;
    totalHours: number;
    siteId: string | Site;
    jobDescription: string;
    ownTransport: boolean;
    travelDetails?: {
        distance?: string;
        amount?: number;
        notes?: string;
    };
    attachments: {
        path: string;
        uploadDate: string;
    }[];
    status: 'Pending' | 'Approved' | 'Rejected';
    approvedBy?: string;
    approvedAt?: string;
    approvalComment?: string;
    rejectionReason?: string;
    rejectionComment?: string;
    createdAt: string;
    updatedAt: string;
}

// Overtime Types
export interface Overtime {
    _id: string;
    staffId: string | Staff;
    date: string;
    startTime?: string;
    endTime?: string;
    otHours: number;
    siteId: string | Site;
    reason: string;
    attachment?: {
        path: string;
        uploadDate: string;
    };
    status: 'Pending' | 'Approved' | 'Rejected';
    approvedBy?: string;
    approvedAt?: string;
    approvalComment?: string;
    rejectionReason?: string;
    rejectionComment?: string;
    createdAt: string;
    updatedAt: string;
}

// Leave Types
export interface Leave {
    _id: string;
    staffId: string | Staff;
    leaveType: 'Paid' | 'Unpaid' | 'Sick' | 'Casual';
    startDate: string;
    endDate: string;
    isHalfDay: boolean;
    reason: string;
    attachment?: {
        path: string;
        uploadDate: string;
    };
    status: 'Pending' | 'Approved' | 'Rejected';
    approvedBy?: string;
    approvedAt?: string;
    approvalComment?: string;
    rejectionComment?: string;
    totalDays: number;
    createdAt: string;
    updatedAt: string;
}

// Payroll Types
export interface Payroll {
    _id: string;
    staffId: string | Staff;
    periodStart: string;
    periodEnd: string;
    normalHours: number;
    normalPay: number;
    otHours: number;
    otPay: number;
    travelExpenses: number;
    leaveDeductions: number;
    totalPay: number;
    isPaid: boolean;
    paidAt?: string;
    generatedBy?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Settings Types
export interface Settings {
    _id: string;
    timezone: string;
    currency: 'USD' | 'GBP' | 'EUR' | 'INR' | 'SGD' | 'AUD' | 'CAD';
    companyName: string;
    companyAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    companyLogo?: string;
    workingHoursPerDay: number;
    globalOtRate: number;
    leaveTypes: {
        name: string;
        isPaid: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
}

// Audit Log Types
export interface AuditLog {
    _id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    description?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    count?: number;
    total?: number;
    page?: number;
    pages?: number;
    message?: string;
}
