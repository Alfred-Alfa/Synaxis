# Comprehensive Test Plan for HRMS

## 1. Authentication & Authorization
- [ ] **Register Super Admin**: Verify the first user registered becomes the Super Admin.
- [ ] **Login**: Verify successful login returns a strict JWT token and user details.
- [ ] **Access Control**: Verify that non-admin users cannot access admin routes.

## 2. Staff Management
- [ ] **Create Staff**: Admin can create a new staff member with details (Name, Email, Rates, etc.).
- [ ] **List Staff**: Admin can view a list of all staff members.
- [ ] **Update Staff**: Admin can update staff details (e.g., hourly rate).
- [ ] **Deactivate Staff**: Admin can deactivate a staff member.

## 3. Site Management
- [ ] **Create Site**: Admin can create a new work site.
- [ ] **List Sites**: Admin can view active sites.

## 4. Time Entry (Core Workflow)
- [ ] **Create Time Entry**: Staff can submit a time entry for a specific site and date.
- [ ] **View Time Entries**: Admin can see pending time entries.
- [ ] **Approve Time Entry**: Admin can approve a pending time entry.
- [ ] **Reject Time Entry**: Admin can reject a time entry with a reason.

## 5. Payroll
- [ ] **Generate Payroll**: Admin can generate payroll for a period.
- [ ] **Verify Calculations**:
    - Normal Hours * Hourly Rate
    - OT Hours * (Hourly Rate * OT Multiplier)
    - Total Pay = Normal Pay + OT Pay + Expenses
- [ ] **Payslip**: Verify payslip generation (mock check).

## 6. Settings
- [ ] **Update Settings**: Admin can update global settings (e.g., Global OT Rate).

## 7. Audit Logs
- [ ] **Verify Logging**: Critical actions (Create User, Approve Time Entry) should create an audit log entry.
