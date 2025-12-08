# Comprehensive Manual Testing Plan

This document outlines the testing procedures for the entire HRMS application, covering all modules and roles.

## 0. Prerequisites
- **Admin Account**: `it@elitecraftuk.com` (SuperAdmin privileges)
- **Staff Account**: Create a test staff account during testing.
- **Environment**: Ensure backend and frontend servers are running (`npm run dev`).

---

## 1. Authentication Module
### Login
- [ ] **Admin Login**: Login with valid admin credentials. Verify redirection to Admin Dashboard.
- [ ] **Staff Login**: Login with valid staff credentials. Verify redirection to Staff Dashboard.
- [ ] **Invalid Login**: Try invalid email/password. Verify error message "Invalid credentials".
- [ ] **Empty Fields**: Try to login without email/password. Verify HTML5 validation.

### Password Management
- [ ] **Forgot Password**:
    - [ ] Click "Forgot Password".
    - [ ] Enter valid email.
    - [ ] Verify toast success message "Password reset email sent".
    - [ ] Check inbox for reset link.
- [ ] **Reset Password Flow**:
    - [ ] Click link in email.
    - [ ] Enter new password.
    - [ ] Verify success and redirection to login.
- [ ] **Force Password Change (New User)**:
    - [ ] Login with a newly created staff (temp password).
    - [ ] Verify "Set Your Password" modal appears (New Clean UI).
    - [ ] Try setting password < 6 chars (verify error).
    - [ ] Try mismatching confirmation password (verify error).
    - [ ] Set valid password. Verify success and access to dashboard.

---

## 2. Staff Management Module (Admin Only)
**Page**: `/admin/staff`
- [ ] **List View**: Verify all staff are listed with correct Photo, Name, Email, Role, and Status.
- [ ] **Add Staff**:
    - [ ] Click "Add Staff".
    - [ ] Fill all required fields (Name, Email, Hourly Rate).
    - [ ] Select Role (Staff/Admin).
    - [ ] Submit.
    - [ ] **Verify**: Listing updates, Success Toast appears ("Login details sent"), Email received by new staff.
- [ ] **Edit Staff**:
    - [ ] Click Edit icon on a staff.
    - [ ] Change "Hourly Rate" or "Phone".
    - [ ] Save. Verify updates in list.
- [ ] **Documents**:
    - [ ] Click Document icon.
    - [ ] Upload a PDF/Image.
    - [ ] Verify document appears in list.
- [ ] **Deactivate Staff**:
    - [ ] Click Delete/Deactivate.
    - [ ] Confirm modal.
    - [ ] Verify status changes to "Inactive" and user cannot login.

---

## 3. Time Entry & Attendance Module
### Staff Side (`/staff/time-entries`)
- [ ] **Clock In/Out**:
    - [ ] Use Dashboard widgets or Time Entry page.
    - [ ] Verify timer starts/stops.
- [ ] **Manual Entry**:
    - [ ] Add a manual time entry for a past date.
    - [ ] Verify it appears in the list as "Pending".
- [ ] **Edit/Delete**:
    - [ ] Try to edit a pending entry.

### Admin Side (`/admin/time-entries`)
- [ ] **View Entries**: Use date filters and staff filters.
- [ ] **Approval Workflow**:
    - [ ] Find a "Pending" entry.
    - [ ] Approve it. Verify status changes to "Approved".
    - [ ] Reject another. Verify status changes to "Rejected".

---

## 4. Overtime Module
### Staff Side (`/staff/overtime`)
- [ ] **Request Overtime**:
    - [ ] Create request for a specific date and duration.
    - [ ] Verify status is "Pending".
### Admin Side (`/admin/overtime`)
- [ ] **Process Requests**:
    - [ ] View pending requests.
    - [ ] Approve one, Reject another.
    - [ ] Verify status updates on Staff side.

---

## 5. Leave Management Module
### Staff Side (`/staff/leave`)
- [ ] **Apply for Leave**:
    - [ ] Select Annual/Sick/Unpaid leave types.
    - [ ] Select dates.
    - [ ] Submit. Verify status "Pending".
### Admin Side (`/admin/leave`)
- [ ] **Process Leave**:
    - [ ] View pending leave requests.
    - [ ] Approve/Reject.
    - [ ] Verify status updates.

---

## 6. Payroll Module (Admin Only)
**Page**: `/admin/payroll`
- [ ] **Generate Payroll**:
    - [ ] Select a month/year.
    - [ ] Click "Generate Payroll".
    - [ ] Verify list is populated with staff calculations (Regular hours + Overtime).
- [ ] **Process Payment**:
    - [ ] Mark a payroll record as "Paid".
    - [ ] Verify status updates.
- [ ] **Download Payslip**:
    - [ ] Click "Download/View Payslip".
    - [ ] Verify PDF is generated with company logo, correct currency, and breakdown.

---

## 7. Site / Project Management (Admin Only)
**Page**: `/admin/sites`
- [ ] **Create Site**: Add a new site location.
- [ ] **Edit/Delete Site**: Manage existing sites.

---

## 8. Reports Module
**Page**: `/admin/reports` & `/staff/reports`
- [ ] **Admin Reports**:
    - [ ] Generate Attendance Report.
    - [ ] Generate Payroll Report.
    - [ ] Verify Download CSV/PDF function.
- [ ] **Staff Reports**:
    - [ ] View personal attendance summary.
    - [ ] Download personal payslips history.

---

## 9. Settings (Admin Only)
**Page**: `/admin/settings`
- [ ] **Company Profile**:
    - [ ] Update Company Name.
    - [ ] Update Currency.
    - [ ] Upload Company Logo.
    - [ ] **Verify**: Validated that emails and payslips now use the new Name/Logo.
- [ ] **Security**: Change admin password from settings.

---

## 10. Audit Logs (Admin Only)
**Page**: `/admin/audit-logs`
- [ ] **Verification**:
    - [ ] Perform various actions (Create Staff, Approve Leave, Login).
    - [ ] Check Audit Log page.
    - [ ] Verify the actions are recorded with timestamp and user.

---

## 11. Testing Checklist Summary
| Module | Assigned To | Status | Notes |
|T---|---|---|---|
| Authentication | | ⬜ Pending | |
| Staff Management | | ⬜ Pending | |
| Time Tracking | | ⬜ Pending | |
| Overtime | | ⬜ Pending | |
| Leave | | ⬜ Pending | |
| Payroll | | ⬜ Pending | |
| Reports | | ⬜ Pending | |
| Settings | | ⬜ Pending | |
