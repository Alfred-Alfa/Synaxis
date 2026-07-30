# HRMS User Guide

**Version 1.0**  
**Last Updated:** December 2025

Welcome to the comprehensive Human Resource Management System (HRMS) User Guide. This document provides detailed step-by-step instructions for all features available to Administrators and Staff members.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Login & Authentication](#2-login--authentication)
3. [Navigation & Interface](#3-navigation--interface)
4. [Administrator Guide](#4-administrator-guide)
   - 4.1 [Dashboard Overview](#41-dashboard-overview)
   - 4.2 [Staff Management](#42-staff-management)
   - 4.3 [Time Entry Management](#43-time-entry-management)
   - 4.4 [Overtime Management](#44-overtime-management)
   - 4.5 [Leave Management](#45-leave-management)
   - 4.6 [Sites & Projects](#46-sites--projects)
   - 4.7 [Payroll Management](#47-payroll-management)
   - 4.8 [Reports & Analytics](#48-reports--analytics)
   - 4.9 [Audit Logs](#49-audit-logs)
   - 4.10 [System Settings](#410-system-settings)
5. [Staff Guide](#5-staff-guide)
   - 5.1 [Staff Dashboard](#51-staff-dashboard)
   - 5.2 [Recording Time Entries](#52-recording-time-entries)
   - 5.3 [Overtime Requests](#53-overtime-requests)
   - 5.4 [Leave Applications](#54-leave-applications)
   - 5.5 [My Profile](#55-my-profile)
   - 5.6 [Notifications](#56-notifications)
6. [Common Tasks](#6-common-tasks)
7. [Troubleshooting](#7-troubleshooting)
8. [FAQs](#8-faqs)
9. [Support](#9-support)

---

## 1. Getting Started

### System Requirements
- **Browser**: Chrome (v90+), Firefox (v88+), Safari (v14+), or Edge (v90+)
- **Internet Connection**: Stable broadband connection recommended
- **Screen Resolution**: Minimum 1280x720px

### First-Time Access
1. You will receive an email with your login credentials from your administrator
2. Access the HRMS via the URL provided in your welcome email
3. Use the email address and temporary password to log in
4. You will be prompted to change your password on first login

---

## 2. Login & Authentication

### 2.1 Logging In

**Step 1:** Navigate to the HRMS login page  
**Step 2:** Enter your registered email address  
**Step 3:** Enter your password  
**Step 4:** Click the **"Login"** button

> **Tip:** Use the "Remember me" option only on personal/secure devices

### 2.2 First-Time Login & Password Change

When logging in for the first time:

1. The system will display a **"Force Password Change"** modal
2. Enter your new password (minimum 6 characters)
3. Re-enter to confirm
4. Click **"Update Password"**
5. You'll be redirected to your dashboard

**Password Requirements:**
- Minimum 6 characters
- Mix of letters and numbers recommended
- Avoid using common words or personal information

### 2.3 Forgot Password

If you've forgotten your password:

1. Click **"Forgot Password?"** on the login page
2. Enter your registered email address
3. Click **"Send Reset Link"**
4. Check your email inbox (and spam folder)
5. Click the link in the email (valid for 1 hour)
6. Enter and confirm your new password
7. Click **"Reset Password"**

> **Note:** If you don't receive the email within 5 minutes, contact your administrator

### 2.4 Security Features

- **Auto Logout:** The system automatically logs you out after 2 minutes of inactivity for security
- **Session Management:** You can only be logged in from one device at a time
- **Password Encryption:** All passwords are encrypted and never stored in plain text

---

## 3. Navigation & Interface

### 3.1 Main Navigation

**Desktop View:**
- **Top Navbar**: Company logo, notifications, theme toggle, profile menu
- **Left Sidebar**: Main navigation menu based on your role
- **Main Content Area**: Active page content

**Mobile View:**
- Tap the **hamburger menu (☰)** icon in the top-left to access the sidebar
- The sidebar slides in from the left
- Tap outside or on a link to close the sidebar

### 3.2 Theme Toggle

Switch between Light and Dark modes:
1. Click the **moon icon (🌙)** in the top navigation bar
2. The interface will instantly switch themes
3. Your preference is saved automatically

### 3.3 Notifications

Access your notifications:
1. Click the **bell icon (🔔)** in the top navigation
2. View unread notifications (indicated by a red badge)
3. Click on any notification to view details
4. Notifications include: leave approvals, overtime responses, payroll updates

### 3.4 Profile Menu

Access your profile quickly:
1. Click on your **profile icon** in the top-right
2. Options include:
   - **My Profile**: View and edit your profile
   - **Change Password**: Update your password
   - **Logout**: Sign out of the system

---

## 4. Administrator Guide

This section is for users with **Admin** or **SuperAdmin** roles.

### 4.1 Dashboard Overview

The admin dashboard provides a high-level overview of your organization:

**Key Metrics Displayed:**
- **Total Staff**: Active employee count
- **Total Sites/Projects**: Number of active work locations
- **Pending Leave Requests**: Leaves awaiting approval
- **Pending Time Entries**: Manual entries requiring review
- **Pending Overtime**: Overtime claims to process

**Quick Actions:**
- Add new staff member
- Generate payroll
- View reports
- Access settings

---

### 4.2 Staff Management

Navigate to **Staff Management** from the sidebar.

#### 4.2.1 Adding a New Staff Member

**Step 1:** Click the **"+ Add Staff"** button

**Step 2: Personal Information**
- **Full Name** (Required): Employee's complete name
- **Email Address** (Required): Unique email for login
- **Phone Number** (Optional): Contact number
- **Address** (Optional): Residential address

**Step 3: Employment Details**
- **Employee ID** (Optional): Custom identifier (e.g., EMP001)
- **Designation** (Optional): Job title (e.g., "Senior Developer")
- **Start Date** (Optional): Employment start date
- **System Role** (Required): Select from:
  - **Staff**: Basic employee access
  - **Admin**: Administrative privileges
  - **SuperAdmin**: Full system access

**Step 4: Compensation**
- **Hourly Rate** (Required): Base hourly pay rate in your configured currency
- **Overtime Multiplier** (Optional): Custom OT rate (default: 1.5x)
  - Example: If hourly rate is $20 and multiplier is 1.5, OT rate is $30/hour

**Step 5: Bank Details** (for payroll)
- **Bank Name**: Employee's bank
- **Account Number**: Bank account or IBAN
- **BSB/Sort Code/IFSC**: Branch identifier
- **Account Holder Name**: Name on the account

**Step 6: Initial Password**
- Leave blank to use default: `password123`
- Or set a custom temporary password
- Employee must change this on first login

**Step 7:** Click **"Create Profile"**

> **Success:** An email with login credentials is automatically sent to the new employee

#### 4.2.2 Editing Staff Information

1. In the Staff Management table, click the **edit icon (✏️)** next to any employee
2. Modify any fields (email cannot be changed)
3. Click **"Save Changes"**

**Role Change Confirmation:**
- If changing an employee's role, you'll see a confirmation dialog
- Confirm to proceed with the role change
- This affects their system permissions immediately

#### 4.2.3 Activating/Deactivating Staff

**To Deactivate:**
1. Click the toggle switch next to an active employee
2. Confirm the action
3. The employee can no longer log in
4. Their data remains in the system for records

**To Reactivate:**
1. Filter to show "Inactive" staff
2. Click the toggle switch
3. Employee can now log in again

#### 4.2.4 Viewing Staff Details

Click on any staff member's name to view:
- Complete profile information
- Employment history
- Current assignments
- Recent activity

---

### 4.3 Time Entry Management

Navigate to **Time Entries** from the sidebar.

#### 4.3.1 Viewing Time Entries

**Filter Options:**
- **Date Range**: Select start and end dates
- **Staff Member**: Filter by specific employee
- **Status**: All, Pending, Approved, Rejected

**Entry Information Displayed:**
- Staff name and photo
- Date of entry
- Clock-in time
- Clock-out time (if clocked out)
- Total hours worked
- Entry type (Auto/Manual)
- Current status

#### 4.3.2 Approving Time Entries

For manual entries requiring approval:

1. Review the entry details
2. Click the **checkmark icon (✓)** to approve
3. Optionally add a comment
4. Click **"Approve"**

The entry is now counted toward payroll calculation.

#### 4.3.3 Rejecting Time Entries

If an entry needs correction:

1. Click the **reject icon (✕)**
2. **Required:** Add a rejection reason/comment
3. Click **"Reject"**
4. The employee is notified and can see your comment

#### 4.3.4 Deleting Time Entries

To remove an incorrect entry:

1. Click the **delete icon (🗑️)**
2. Confirm deletion
3. Entry is permanently removed

> **Warning:** Deletions are logged in Audit Logs but cannot be undone

---

### 4.4 Overtime Management

Navigate to **Overtime** from the sidebar.

#### 4.4.1 Reviewing Overtime Requests

**Request Details Include:**
- Staff member name
- Date of overtime work
- Number of hours claimed
- Calculated overtime pay
- Reason for overtime
- Current status

#### 4.4.2 Approving Overtime

1. Review the overtime details
2. Verify hours and reason
3. Click **"Approve"**
4. Optionally add approval comments
5. Overtime is added to the next payroll cycle

#### 4.4.3 Rejecting Overtime

1. Click **"Reject"**
2. **Required:** Provide rejection reason
3. Employee is notified immediately
4. They can view your comments in their overtime history

---

### 4.5 Leave Management

Navigate to **Leave Requests** from the sidebar.

#### 4.5.1 Viewing Leave Requests

**View Modes:**
- **List View**: Table of all requests
- **Calendar View**: Visual leave calendar

**Filter By:**
- Date range
- Leave type (Paid, Unpaid, Sick, Casual)
- Status (Pending, Approved, Rejected)
- Staff member

#### 4.5.2 Leave Request Details

Each request shows:
- Employee name and designation
- Leave type
- Start and end dates
- Duration (full days or half-day)
- Reason
- Any attached medical certificate (for sick leave)
- Current balance of that leave type

#### 4.5.3 Processing Leave Requests

**To Approve:**
1. Review leave balance to ensure availability
2. Check for conflicts with other team members
3. Click **"Approve"**
4. Add optional approval comments
5. Confirm action

**To Reject:**
1. Click **"Reject"**
2. Provide clear rejection reason
3. Suggest alternative dates if applicable
4. Submit rejection

> **Best Practice:** Communicate verbally for sensitive rejections

#### 4.5.4 Leave Calendar

The calendar view shows:
- Color-coded leave types
- Team availability at a glance
- Overlapping leaves (potential staffing issues)
- Public holidays (if configured)

---

### 4.6 Sites & Projects

Navigate to **Sites/Projects** from the sidebar.

#### 4.6.1 Creating a New Site

1. Click **"+ Add Site"**
2. Enter required information:
   - **Site Name** (Required)
   - **Site Code** (Optional): Short identifier
   - **Location** (Optional): Physical address
   - **Description** (Optional): Site details
3. Click **"Create Site"**

#### 4.6.2 Managing Sites

**Edit Site:**
- Click edit icon next to any site
- Update details
- Save changes

**Delete Site:**
- Click delete icon
- Confirm deletion
- Site is removed (ensure no active assignments)

**Assign Staff:**
- Select site
- Click "Assign Staff"
- Choose employees from the list
- Save assignments

---

### 4.7 Payroll Management

Navigate to **Payroll** from the sidebar.

#### 4.7.1 Generating Payroll

**Step 1:** Click **"Generate Payroll"** button

**Step 2:** Select Parameters
- **Pay Period**: Choose month and year
- **Staff Selection**:
  - All Active Staff (recommended)
  - Specific employees
  - By department/site

**Step 3:** Review Calculation Preview
The system shows:
- Number of employees
- Total normal hours
- Total overtime hours
- Estimated total payout
- Breakdown by staff member

**Step 4:** Confirm Generation
- Review all details carefully
- Click **"Generate"**
- Processing may take a few moments for large teams

**What Happens:**
- System calculates each employee's pay based on:
  - Approved time entries for the period
  - Hourly rate
  - Approved overtime
  - Leave deductions (for unpaid leave)
  - Travel expenses (if any)
- Payroll records are created
- Payslips are generated
- Status set to "Pending" (unpaid)

#### 4.7.2 Viewing Payroll Records

**Filter By:**
- Year
- Month
- Payment status (Paid/Pending)
- Staff member

**Record Details:**
- **Staff Information**: Name, email
- **Pay Period**: Start and end dates
- **Hours Breakdown**:
  - Normal hours worked
  - Overtime hours
  - Overtime pay amount
- **Additional Components**:
  - Travel expenses
  - Deductions (unpaid leave)
- **Total Pay**: Final amount
- **Status**: Paid or Pending
- **Payment Date**: When marked as paid

#### 4.7.3 Downloading Payslips

For any payroll record:
1. Click the **download icon (⬇️)**
2. PDF payslip is generated and downloaded
3. Payslip includes:
   - Company logo and details
   - Employee information
   - Pay period
   - Detailed breakdown
   - Bank details (if provided)
   - Net pay amount
   - Generated date

> **Tip:** Payslips can be emailed directly to employees from the system

#### 4.7.4 Editing Payroll Records

If corrections are needed:
1. Click the **edit icon (✏️)** next to the record
2. Modify:
   - Normal hours
   - Overtime hours
   - Travel expenses
   - Deductions
3. Recalculated total is shown automatically
4. Save changes

> **Note:** Add a comment explaining the reason for manual adjustments

#### 4.7.5 Marking Payroll as Paid

Once payment is processed:
1. Click **"Mark as Paid"** button
2. Confirm the action
3. Record is updated with:
   - Status: Paid
   - Payment date: Current date
4. Employee is notified

**Bulk Mark as Paid:**
1. Select multiple records using checkboxes
2. Click "Mark Selected as Paid"
3. Confirm bulk action

#### 4.7.6 Deleting Payroll Records

To remove incorrect records:
1. Click the **delete icon (🗑️)**
2. Confirm deletion
3. Record is permanently removed

> **Warning:** Only delete records that haven't been paid. This action is irreversible.

---

### 4.8 Reports & Analytics

Navigate to **Reports & Analytics** from the sidebar.

#### 4.8.1 Available Reports

**Attendance Reports:**
- Daily attendance summary
- Monthly attendance by staff
- Absence tracking
- Late arrivals and early departures

**Payroll Reports:**
- Monthly payroll summary
- Year-to-date payroll
- Department-wise salary breakdown
- Overtime analysis

**Leave Reports:**
- Leave utilization by type
- Leave balance report
- Leave trends over time
- Staff on leave (current)

**Performance Metrics:**
- Hours worked vs. planned
- Overtime patterns
- Attendance rate
- Leave usage rate

#### 4.8.2 Generating Reports

1. Select report type from dropdown
2. Set parameters:
   - Date range
   - Department/Site (if applicable)
   - Staff members (specific or all)
3. Click **"Generate Report"**
4. View on-screen preview

#### 4.8.3 Exporting Reports

**Export Formats:**
- **PDF**: Professional formatted document
- **CSV**: For Excel/data analysis
- **Excel**: Formatted spreadsheet

**To Export:**
1. Generate the report
2. Click **"Export"** button
3. Select format
4. File downloads automatically

#### 4.8.4 Scheduled Reports

Set up automated reports:
1. Configure report parameters
2. Set frequency (Daily, Weekly, Monthly)
3. Add recipient email addresses
4. Activate schedule
5. Reports are emailed automatically

---

### 4.9 Audit Logs

Navigate to **Audit Logs** from the sidebar.

**What's Logged:**
- All system actions by all users
- Login/logout events
- Data creation, updates, deletions
- Approval/rejection actions
- Settings changes

**Log Details:**
- Timestamp
- User who performed the action
- Action type
- Target (what was changed)
- IP address
- Browser information

**Searching Logs:**
- Filter by date range
- Filter by user
- Filter by action type
- Search by keyword

> **Compliance:** Audit logs are retained for 365 days for compliance purposes

---

### 4.10 System Settings

Navigate to **Settings** from the sidebar.

#### 4.10.1 Company Identity

**Company Logo:**
1. Click **"Change Logo"**
2. Select image file (PNG, JPG - max 5MB)
3. Preview appears
4. Click **"Upload"**
5. Logo updates throughout the system

**Company Name:**
1. Enter or update company name
2. Appears in:
   - Navigation bar
   - Email templates
   - Generated payslips
   - Reports

**Company Contact Information:**
- **Email**: Contact email for official communications
- **Phone**: Company phone number with country code selector
- **Address**: Complete business address

#### 4.10.2 Regional & Localization

**Timezone:**
- Select from global timezones
- Affects all timestamps in the system
- Important for remote teams

**Currency:**
- Choose from major currencies:
  - USD ($), EUR (€), GBP (£)
  - INR (₹), SGD (S$), AUD (A$)
  - AED, CAD, and more
- Affects all financial displays and reports

#### 4.10.3 Payroll Configuration

**Global Overtime Multiplier:**
- Default rate for all employees
- Can be overridden per employee
- Standard value: 1.5x
- Applies to overtime calculations

**Leave Policies:**
- Annual leave entitlement
- Sick leave days
- Casual leave allocation
- Leave accrual rules

#### 4.10.4 Roles & Permissions

**System Roles:**
1. **SuperAdmin**
   - Full system access
   - Can manage all features
   - Can change other users' roles
   - Access to audit logs

2. **Admin**
   - Administrative access
   - Cannot change SuperAdmin settings
   - Can manage staff and operations
   - Cannot access audit logs

3. **Staff**
   - Employee portal access
   - Can manage own records only
   - Submit requests
   - View personal data

**Customizing Permissions:**
(Available in future updates)

#### 4.10.5 Saving Settings

- Click **"Save Configuration"** at the bottom
- All settings are saved
- Changes take effect immediately
- Users may need to refresh for some updates

---

## 5. Staff Guide

This section is for users with the **Staff** role.

### 5.1 Staff Dashboard

Your dashboard provides a personalized overview:

**Quick Stats:**
- Your current leave balance
- Hours worked this month
- Pending requests status
- Upcoming shifts/assignments

**Recent Activity:**
- Latest time entries
- Recent overtime submissions
- Leave application status
- Notifications

**Quick Actions:**
- Clock In/Out
- Request Overtime
- Apply for Leave
- Update Profile

---

### 5.2 Recording Time Entries

Navigate to **Time Entries** from the sidebar.

#### 5.2.1 Clocking In

**Using the Timer:**
1. Click the **"Clock In"** button
2. System records:
   - Current date and time
   - Your location (if enabled)
   - Entry type: Auto
3. Timer starts running
4. You'll see "Currently Clocked In" status

**What to Remember:**
- Clock in when you start work
- Only one active clock-in allowed
- If you forget, you can submit a manual entry later

#### 5.2.2 Clocking Out

**When You're Done:**
1. Click the **"Clock Out"** button
2. System records:
   - Clock-out time
   - Calculates total hours
   - Entry moves to "Completed"
3. Time is automatically approved if auto-entry

#### 5.2.3 Submitting Manual Entries

If you forgot to clock in/out:

**Step 1:** Click **"Add Manual Entry"**

**Step 2:** Fill in details:
- **Date** (Required): Date of work
- **Clock In Time** (Required): When you started
- **Clock Out Time** (Required): When you finished
- **Site/Project** (Optional): Where you worked
- **Notes** (Optional): Reason for manual entry

**Step 3:** Click **"Submit for Approval"**

**Status:** "Pending Approval"
- Your manager will review
- You'll be notified of approval/rejection
- Check notifications for updates

#### 5.2.4 Viewing Your Time History

**Filter Options:**
- Date range
- Entry status
- Entry type (Auto/Manual)

**Entry Details:**
- Date worked
- In/Out times
- Total hours
- Site/Project
- Status (Approved/Pending/Rejected)
- Admin comments (if any)

---

### 5.3 Overtime Requests

Navigate to **Overtime** from the sidebar.

#### 5.3.1 Submitting an Overtime Request

**Step 1:** Click **"Request Overtime"**

**Step 2:** Provide details:
- **Date** (Required): When you worked overtime
- **Hours** (Required): Number of extra hours
- **Reason** (Required): Why overtime was necessary
  - Example: "Project deadline", "Emergency fix", "Staff shortage"

**Step 3:** Click **"Submit Request"**

**What Happens:**
- Request sent to your manager
- Status: Pending
- OT pay is calculated automatically based on your rate
- You'll be notified when processed

#### 5.3.2 Tracking Overtime Status

**Your Overtime Dashboard Shows:**
- Pending requests
- Approved overtime (to be paid)
- Rejected requests with reasons
- Total overtime hours this month
- Estimated overtime pay

**Status Indicators:**
- 🕐 **Pending**: Awaiting manager review
- ✅ **Approved**: Will be included in next payroll
- ❌ **Rejected**: Not approved (see comments)

#### 5.3.3 Editing Pending Requests

Before approval:
1. Click edit icon on pending request
2. Modify hours or reason
3. Resubmit
4. Previous version is replaced

> **Note:** Cannot edit approved or rejected requests

---

### 5.4 Leave Applications

Navigate to **Leave** from the sidebar.

#### 5.4.1 Checking Leave Balance

Your leave dashboard shows:
- **Paid Leave**: Days remaining
- **Sick Leave**: Days remaining
- **Casual Leave**: Days remaining
- **Unpaid Leave**: Unlimited (but affects pay)

**Leave Usage This Year:**
- Taken
- Pending approval
- Remaining balance
- Next accrual date

#### 5.4.2 Applying for Leave

**Step 1:** Click **"Apply for Leave"**

**Step 2:** Select leave type:
- **Paid Leave**: Annual vacation
- **Sick Leave**: Medical reasons
- **Casual Leave**: Personal matters
- **Unpaid Leave**: Without pay

**Step 3:** Choose dates:
- **Start Date** (Required)
- **End Date** (Required)
- **Half Day**: Check if only half day needed

**Step 4:** Provide reason:
- Brief explanation of leave purpose
- More detail helps faster approval

**Step 5:** Attach document (Medical Certificate for sick leave):
- Click "Choose File"
- Select PDF or image
- Max 5MB size

**Step 6:** Click **"Submit Application"**

**Confirmation:**
- You'll see a success message
- Request appears in your leave list
- Manager is notified
- You'll receive approval/rejection notification

#### 5.4.3 Leave Application Status

**Status Types:**
- **Pending**: Awaiting manager decision
- **Approved**: Leave granted
  - Shows on calendar
  - Counted toward balance
- **Rejected**: Not approved
  - Balance unchanged
  - See manager's comments
  - Can reapply with different dates

#### 5.4.4 Cancelling Leave

For approved leave before the date:
1. Go to approved leave request
2. Click **"Cancel Leave"**
3. Provide cancellation reason
4. Confirm cancellation
5. Balance is restored
6. Manager is notified

> **Policy:** Check company policy for cancellation deadlines

#### 5.4.5 Leave Calendar

Visual calendar view shows:
- Your approved leaves
- Team members on leave (if visible)
- Public holidays
- Helps plan future leave

---

### 5.5 My Profile

Navigate to **Profile** from the sidebar or profile menu.

#### 5.5.1 Viewing Profile Information

**Personal Details:**
- Full name
- Email address
- Phone number
- Address
- Employee ID

**Employment Information:**
- Designation
- Department
- Start date
- Reporting manager
- System role

**Compensation:** (View only)
- Hourly rate
- Overtime rate
- Bank details (masked)

#### 5.5.2 Changing Password

**Navigate to Profile → Change Password**

**Step 1:** Enter current password  
**Step 2:** Enter new password (min 6 characters)  
**Step 3:** Confirm new password  
**Step 4:** Click **"Update Password"**

**Security Tips:**
- Don't share your password
- Use a unique password
- Change regularly
- Don't write it down

#### 5.5.3 Updating Contact Information

Some fields you can update:
- Phone number
- Address

**To Update:**
1. Click **"Edit Profile"**
2. Modify allowed fields
3. Click **"Save Changes"**
4. Updates are logged

> **Note:** Email and role changes require admin approval

---

### 5.6 Notifications

Access via the bell icon (🔔) in top navigation.

#### 5.6.1 Notification Types

You receive notifications for:
- **Leave Status**: Application approved/rejected
- **Overtime Status**: Request processed
- **Time Entry**: Admin comments or rejections
- **Payroll**: Payslip available
- **System**: Important announcements

#### 5.6.2 Managing Notifications

**Viewing:**
- Unread shown with blue dot
- Click to view details
- Auto-marks as read

**Filtering:**
- All notifications
- Unread only
- By type

**Actions:**
- Mark as read/unread
- Delete notification
- Clear all read

**Settings:**
- Enable/disable email notifications
- Choose notification types
- Set quiet hours

---

## 6. Common Tasks

### 6.1 Running Monthly Payroll (Admin)

**Complete Workflow:**

1. **Week Before Month-End:**
   - Remind staff to submit pending overtime
   - Review pending leave applications
   - Check all time entries are approved

2. **Last Day of Month:**
   - Generate payroll for the month
   - Review calculation preview
   - Check for anomalies (very high/low hours)

3. **Beginning of New Month:**
   - Download all payslips
   - Process payments through your bank
   - Mark all records as "Paid" in system
   - Email payslips to employees

4. **Record Keeping:**
   - Export payroll report
   - Save to company records
   - Archive payslips

### 6.2 Onboarding New Employee (Admin)

**Complete Checklist:**

1. **Pre-Start:**
   - Create staff profile in system
   - Set appropriate role and hourly rate
   - Add bank details for payroll
   - Assign to site/project
   - Email login credentials (auto-sent)

2. **First Day:**
   - Welcome employee
   - Verify they received login email
   - Help them log in and change password
   - Show them how to clock in/out
   - Explain leave application process

3. **First Week:**
   - Check they're clocking in/out correctly
   - Review their time entries
   - Answer questions about overtime
   - Verify profile information

4. **First Month:**
   - Include in first payroll
   - Review their payslip with them
   - Check bank payment successful

### 6.3 Handling Leave Conflicts (Admin)

**When Multiple Staff Request Same Dates:**

1. Check business requirements
2. Priority factors:
   - First-come, first-served (usually)
   - Critical roles coverage
   - Remaining leave balance
   - Special circumstances

3. Communicate with team
4. Approve based on policy
5. Suggest alternatives to others
6. Document decision reasoning

### 6.4 Correcting Payroll Errors (Admin)

**If Error Found After Generation:**

1. **Before Payment:**
   - Edit the payroll record
   - Adjust hours/deductions
   - Add explanatory comment
   - Regenerate payslip
   - Verify correction

2. **After Payment:**
   - Cannot edit paid records
   - Create adjustment entry for next month
   - Or process separate correction payment
   - Document in audit log

---

## 7. Troubleshooting

### 7.1 Login Issues

**Problem:** "Invalid credentials" error  
**Solutions:**
- Verify email address is correct
- Check password (case-sensitive)
- Use "Forgot Password" if uncertain
- Contact admin if account locked

**Problem:** Password reset email not received  
**Solutions:**
- Check spam/junk folder
- Wait 5-10 minutes
- Verify email address on file
- Contact admin to resend

**Problem:** Logged out unexpectedly  
**Solution:**
- This is normal after 2 minutes of inactivity
- Log back in
- Save work frequently

### 7.2 Time Entry Issues

**Problem:** Clock-in button not working  
**Solutions:**
- Refresh the page
- Check you're not already clocked in
- Clear browser cache
- Try different browser

**Problem:** Forgot to clock out  
**Solution:**
- Submit a manual entry for that day
- Include explanation in notes
- Manager will approve/adjust

**Problem:** Manual entry rejected  
**Solution:**
- Check admin's rejection comment
- Verify times are correct
- Resubmit with correct information
- Contact manager if unclear

### 7.3 Leave Application Issues

**Problem:** "Insufficient leave balance" error  
**Solutions:**
- Check your leave balance
- Reduce leave duration
- Switch to unpaid leave
- Talk to HR about leave advance

**Problem:** Cannot cancel approved leave  
**Solutions:**
- Contact your manager directly
- They can cancel on admin side
- Explain urgent reason
- Follow company policy

### 7.4 Payroll Issues

**Problem:** Payslip amount seems incorrect  
**Solutions:**
- Check detailed breakdown
- Verify hours worked match records
- Check for unpaid leave deductions
- Calculate overtime manually
- Contact admin if still incorrect

**Problem:** Cannot download payslip  
**Solutions:**
- Try different browser
- Disable popup blocker
- Check file download settings
- Request admin to email it

### 7.5 Performance Issues

**Problem:** System running slowly  
**Solutions:**
- Close unnecessary browser tabs
- Clear browser cache
- Check internet connection
- Try during off-peak hours

**Problem:** Page not loading  
**Solutions:**
- Refresh the page (F5)
- Clear browser cache
- Check internet connection
- Try incognito/private mode
- Contact IT support

---

## 8. FAQs

**Q: How do I know what my leave balance is?**  
A: Go to Leave → Your dashboard shows current balance for each leave type.

**Q: Can I edit a time entry after clocking out?**  
A: No, time entries are locked after completion. Contact your admin if correction needed.

**Q: What happens if I clock in but forget to clock out?**  
A: The entry remains "open". Clock out as soon as you remember, or submit a manual entry.

**Q: How is overtime calculated?**  
A: OT Pay = Overtime Hours × Hourly Rate × OT Multiplier (usually 1.5x)

**Q: When are payslips available?**  
A: Usually first week of each month, after admin generates payroll.

**Q: Can I apply for leave retroactively?**  
A: Depends on company policy. Generally, apply in advance. Emergency situations may be considered.

**Q: How do I change my email address?**  
A: Contact your administrator - only they can change email addresses.

**Q: What if I work on a public holiday?**  
A: Submit overtime for those hours. Rate may differ based on company policy.

**Q: Can I see my colleagues' leave schedules?**  
A: Depends on permissions. Usually staff see general team calendar, admins see all details.

**Q: How long are records kept?**  
A: All records are retained indefinitely for compliance. Audit logs: 365 days.

---

## 9. Support

### Contact Information

**For Technical Issues:**
- **Email**: it-support@yourcompany.com
- **Phone**: [Support Number]
- **Hours**: Monday-Friday, 9 AM - 6 PM

**For HR/Payroll Questions:**
- **Email**: hr@yourcompany.com
- **Phone**: [HR Number]
- **In-Person**: HR Office, [Location]

**For System Administrator:**
- **Email**: admin@yourcompany.com
- **For**: Account issues, access problems, permission requests

### Reporting Bugs

If you encounter a system error:
1. Note what you were doing when it occurred
2. Take a screenshot if possible
3. Record any error messages
4. Email to IT support with details
5. Include browser and device information

### Feature Requests

Have an idea to improve the system?
1. Document your suggestion clearly
2. Explain the business benefit
3. Submit to your manager or HR
4. Feature requests are reviewed quarterly

### Training Resources

**Video Tutorials:** [Link if available]  
**Knowledge Base:** [Link if available]  
**Live Training Sessions:** Contact HR to schedule  
**Quick Reference Cards:** Available in shared drive

---

## Appendix A: Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Notifications | Alt + N |
| Toggle Theme | Alt + T |
| Go to Dashboard | Alt + H |
| Logout | Alt + L |
| Search | Ctrl + K |

---

## Appendix B: Mobile App Usage

*Note: Mobile app features match web version*

**iOS/Android Apps:**
- Download from App Store / Play Store
- Login with same credentials
- Full feature parity with web
- Fingerprint/Face ID support
- Push notifications enabled

---

## Appendix C: Data Privacy & Security

**Your Data:**
- Encrypted in transit and at rest
- Access logs maintained
- Backed up daily
- GDPR/Privacy compliant

**Your Rights:**
- Request data export
- Request data deletion (subject to legal retention)
- Update personal information
- Control notification preferences

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Next Review:** March 2026

For the latest version of this guide, visit: [Company Intranet/Documentation Portal]

---

*© 2025 [Your Company Name]. All rights reserved.*
