 # Security Enhancement: Employee Presence Verification

To address the security concern that "no monitoring is happening to verify if the real employee is working", we will implement a multi-layered verification system. This ensures that the person who checked in is the authorized employee and is physically present at the worksite throughout their shift.

## Proposed Solution Layers

### 1. Selfie-Based Verification (Visual Proof)
- **Check-in Selfie**: Requirement for the employee to take a real-time photo (selfie) during check-in.
- **Check-out Selfie**: Requirement for a photo during check-out to verify the same person is leaving.
- **Admin Review**: Managers can view these photos in the Time Entry details to verify identity.

### 2. Device Binding (Hardware Proof)
- **Unique Device ID**: Each employee's account will be "bound" to their specific mobile device or browser.
- **Mismatch Alert**: If an employee tries to check in from a different device, the system will flag it as "Unauthorized Device" and require admin approval.

### 3. Continuous Geofence Monitoring (Ongoing Proof)
- **Real-time Tracking**: The app will continue to monitor the user's location while they are checked in.
- **Automatic Alerts**: If the user leaves the geofence area without checking out, a notification is sent to the manager.

### 4. Random Activity Heartbeats (Behavioral Proof)
- **Presence Check**: Periodically (e.g., once every 2 hours), the app can request a "Confirm Presence" click or a random selfie to ensure the device wasn't just left at the site.

---

## Implementation Tasks

### Phase 1: Foundation (Backend)
- [x] Update `TimeEntry` model to store `checkInPhoto`, `checkOutPhoto`, and `deviceId`.
- [x] Update API routes to handle multi-part form data for photo uploads.
- [x] Implement device fingerprint storage in the `Staff` profile.

### Phase 2: User Experience (Frontend)
- [ ] Implement a Photo Capture component in the Staff Dashboard.
- [ ] Update `timeEntryService` to send photos and device metadata.
- [ ] Add device identification logic (generating a persistent UUID).

### Phase 3: Monitoring & Dashboards (Admin)
- [ ] Update Admin Time Entry view to display verification photos.
- [ ] Add "Device Mismatch" warnings to the Audit Logs.
