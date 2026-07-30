# Overtime Bug Fix - Testing Guide

## 🧪 Manual Testing Steps

### Test Case 1: Auto-Calculation (Happy Path)
**Steps:**
1. Log in to the web app as a staff member
2. Navigate to Overtime page
3. Click "New Overtime Request"
4. Fill in:
   - Date: Today
   - Site/Project: Select any
   - Start Time: `09:00`
   - End Time: `17:00`
5. **Observe**: OT Hours field should auto-populate with `8.00`
6. **Observe**: Field should be read-only (grey background)
7. Fill in Reason: "Regular overtime work"
8. Click "Submit Request"

**Expected Result:**
- ✅ Form submits successfully
- ✅ No NaN error
- ✅ Overtime appears in list with 8.00 hours
- ✅ Backend receives valid number

---

### Test Case 2: Invalid Time Range (Negative Hours)
**Steps:**
1. Open "New Overtime Request"
2. Fill in:
   - Date: Today
   - Site/Project: Select any
   - Start Time: `17:00`
   - End Time: `09:00` (earlier than start)
3. **Observe**: Error message appears below OT Hours field
4. **Observe**: Error reads: "End time must be greater than start time"
5. **Observe**: Submit button is disabled
6. Try to submit anyway

**Expected Result:**
- ✅ Error message displayed
- ✅ Submit button disabled (greyed out)
- ✅ Form cannot be submitted
- ✅ User is guided to fix the issue

---

### Test Case 3: Same Start and End Time
**Steps:**
1. Open "New Overtime Request"
2. Fill in:
   - Start Time: `10:00`
   - End Time: `10:00` (same time)
3. **Observe**: OT Hours shows `0.00`
4. **Observe**: Error message appears
5. Try to submit

**Expected Result:**
- ✅ Validation error shown
- ✅ Submit button disabled
- ✅ Cannot submit with 0 hours

---

### Test Case 4: Manual OT Hours Entry
**Steps:**
1. Open "New Overtime Request"
2. **DO NOT** select start/end time
3. Directly type in OT Hours: `4.5`
4. Fill other required fields
5. Submit

**Expected Result:**
- ✅ Form accepts manual entry
- ✅ Submits successfully
- ✅ 4.5 hours saved correctly

---

### Test Case 5: Decimal Hour Calculation
**Steps:**
1. Open "New Overtime Request"
2. Fill in:
   - Start Time: `09:00`
   - End Time: `11:30`
3. **Observe**: OT Hours should show `2.50`
4. Submit the form

**Expected Result:**
- ✅ Calculates to 2 decimal places
- ✅ Shows `2.50` (not `2.5` or `2.499999`)
- ✅ Submits successfully

---

### Test Case 6: Changing Times After Initial Entry
**Steps:**
1. Open "New Overtime Request"
2. Start Time: `09:00`
3. End Time: `17:00` → OT Hours shows `8.00`
4. **Change** End Time to: `13:00`
5. **Observe**: OT Hours updates to `4.00` instantly

**Expected Result:**
- ✅ OT Hours recalculates immediately
- ✅ No delay or manual refresh needed
- ✅ Shows correct value

---

### Test Case 7: Clearing Times Reverts to Manual
**Steps:**
1. Open "New Overtime Request"
2. Start Time: `09:00`
3. End Time: `17:00` → Field becomes read-only
4. Clear Start Time (backspace)
5. Clear End Time
6. **Observe**: Field becomes editable again
7. Manually enter: `6.0`
8. Submit

**Expected Result:**
- ✅ Field allows manual entry after clearing times
- ✅ Manual value is accepted
- ✅ Form submits successfully

---

### Test Case 8: Edit Existing Overtime
**Steps:**
1. Create an overtime request (any valid values)
2. Find it in the list (should be Pending status)
3. Click Edit
4. Change Start Time from `09:00` to `10:00`
5. **Observe**: OT Hours recalculates
6. Submit update

**Expected Result:**
- ✅ Update recalculates OT hours
- ✅ Saves successfully
- ✅ No NaN error

---

### Test Case 9: Backend Validation (Direct API Test)
**Using Postman/curl:**
```bash
curl -X POST http://localhost:5000/api/overtime \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-06",
    "siteId": "SITE_ID",
    "reason": "Test",
    "otHours": "invalid"
  }'
```

**Expected Result:**
- ✅ Returns 400 Bad Request
- ✅ Error message: "Invalid OT hours value. Please provide valid start/end time or enter OT hours manually."
- ✅ Does NOT save to database

---

### Test Case 10: Backend Fallback Calculation
**Using Postman/curl:**
```bash
curl -X POST http://localhost:5000/api/overtime \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-06",
    "siteId": "SITE_ID",
    "reason": "Test",
    "startTime": "09:00",
    "endTime": "17:00"
  }'
```
(Note: NO otHours sent)

**Expected Result:**
- ✅ Backend calculates otHours automatically
- ✅ Saves with otHours = 8.0
- ✅ Returns 201 Created

---

## 🔍 Validation Points

For each test, verify:

### Frontend
- [ ] No console errors
- [ ] Field updates in real-time
- [ ] Validation messages appear/disappear correctly
- [ ] Submit button enables/disables appropriately
- [ ] Read-only state toggles correctly

### Backend
- [ ] No "Cast to Number failed" errors
- [ ] No NaN values in database
- [ ] Proper error messages returned
- [ ] Valid numbers stored as Number type

### Database
Check MongoDB directly:
```javascript
db.overtimes.find().sort({_id: -1}).limit(5)
```

Verify:
- [ ] `otHours` field is Number type (not String)
- [ ] No NaN values exist
- [ ] Values have proper decimal precision

---

## 🚨 Red Flags (Should NOT Happen)

If you see any of these, the fix is incomplete:

❌ **"Cast to Number failed for value 'NaN'"** error  
❌ Console error: "Invalid number"  
❌ OT Hours field stays empty after selecting times  
❌ Can submit form with negative hours  
❌ Can submit form when end time < start time  
❌ Field not becoming read-only  
❌ Calculation not happening in real-time  
❌ Database contains NaN values  

---

## ✅ Success Criteria

All tests should:
1. ✅ Calculate OT hours correctly
2. ✅ Show proper validation errors
3. ✅ Block invalid submissions
4. ✅ Submit successfully with valid data
5. ✅ Store valid numbers in database
6. ✅ No backend errors
7. ✅ Match mobile app behavior

---

## 📊 Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

All behaviors should be consistent across browsers.

---

## 🔄 Regression Testing

Ensure no impact on:
- [ ] Leave requests (create/edit)
- [ ] Attendance records
- [ ] Payroll generation
- [ ] Other admin overtime functions (approve/reject)
- [ ] Reports using overtime data
- [ ] Mobile app (no changes expected)

---

## 📱 Mobile App Comparison

If possible, create the same overtime request in mobile app and verify:
- [ ] Both calculate same OT hours for same times
- [ ] Both show same decimal precision
- [ ] Both validate time ranges the same way
- [ ] Backend accepts both payloads identically

The web app behavior should now **exactly match** the mobile app.
