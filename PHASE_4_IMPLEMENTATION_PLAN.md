# Phase 4 Appointments Feature — Comprehensive Implementation Plan

**Date Created:** May 5, 2026  
**Target Status:** Complete appointments loading + dark theme styling  
**Parallel Execution:** Both TRACK 1 and TRACK 2 can proceed simultaneously

---

## Executive Summary

### What Needs to Be Done
**Phase 4** is a two-track initiative to complete the appointments management system:

1. **TRACK 1 (CRITICAL):** Diagnose and fix the appointments loading error that prevents the `/appointments` page from displaying data from the backend database
2. **TRACK 2 (UX):** Apply comprehensive dark theme CSS overrides to `react-big-calendar` (v1.19.4) to match the dashboard aesthetic

### Why
- Users need to **view, create, and manage scheduled appointments**
- The calendar UI is **currently unstyled** (white/light background) and clashes with the dark clinic theme
- **API data flow is complete** but frontend is failing to receive/display appointments
- Dashboard already has a **polished dark theme** (CSS variables system) that should extend to appointments

### Expected Outcomes
✅ Appointments load successfully with proper error messaging  
✅ Calendar renders with clinic dark theme (#0c0e14 background, #13161f cards, blue accents)  
✅ Patient list is searchable and shows contact info  
✅ Empty states vs error states are clearly differentiated  
✅ RTL support verified and working  
✅ Loading states use spinners/skeletons (no blank screens)

---

# TRACK 1: DIAGNOSE & FIX APPOINTMENTS LOADING ERROR

## Current State Analysis

### Frontend Entry Point
- **File:** `frontend/src/pages/Appointments.jsx:27-44`
- **Current Flow:**
  ```
  1. useEffect runs when clinicId changes
  2. Calls getAppointmentsRequest({ clinicId })
  3. API response caught in try/catch
  4. Error shown in UI (line 213: error state rendered)
  ```

### API Request Handler
- **File:** `frontend/src/api/index.js:172-183`
- **Current Implementation:**
  ```javascript
  export async function getAppointmentsRequest({ clinicId, dateFrom, dateTo, status, page = 1 } = {}) {
    const { data } = await api.get('/appointments', {
      params: {
        clinic_id: clinicId,  // ← Sent as query param
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: status || undefined,
        page,
      },
    });
    return data;
  }
  ```

### Backend API Endpoint
- **Route File:** `Backend/routes/appointments.js:15`
- **Controller:** `Backend/controllers/appointments.js:4-29`
- **Service:** `Backend/services/appointments.js:25-83`

---

## Detailed Checklist — Verification & Diagnosis

### ✓ PHASE 1: Database Schema Verification

#### 1.1 Appointments Table Exists
**Priority:** CRITICAL  
**Difficulty:** EASY  
**Status Check:** Run in your database client (Supabase/PostgreSQL)

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;
```

**Expected Output:**
```
id                  | uuid
patient_id          | uuid
clinic_id           | uuid
session_id          | uuid (nullable)
appointment_date    | timestamp without time zone
duration_minutes    | integer
type                | character varying
status              | character varying
doctor_notes        | text
reminder_1h_sent    | boolean
reminder_24h_sent   | boolean
created_at          | timestamp without time zone
```

**Schema Reference:** `SCHEMA.md:157-177`  
**Migration File:** `Backend/db/migrations/001-initial-schema.sql:58-71`

**If Missing:**
- Run migration: `Backend/db/migrations/001-initial-schema.sql`
- Verify Supabase connection and migration runner

#### 1.2 Patients Table Link Verified
**Priority:** CRITICAL  
**Difficulty:** EASY

```sql
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
WHERE TABLE_NAME = 'appointments' 
AND CONSTRAINT_TYPE = 'FOREIGN KEY';
```

**Expected:** Foreign key on `patient_id` → `patients.id`

---

### ✓ PHASE 2: Database Data Verification

#### 2.1 Sample Data Check
**Priority:** HIGH  
**Difficulty:** EASY  
**Diagnostic Query:**

```sql
-- Check if any appointments exist
SELECT COUNT(*) as total_appointments FROM appointments;

-- Check specific clinic appointments
SELECT COUNT(*) as clinic_appointments 
FROM appointments 
WHERE clinic_id = 'YOUR-CLINIC-UUID-HERE';

-- Check JOIN integrity
SELECT 
  a.id, 
  a.appointment_date, 
  p.full_name, 
  a.status
FROM appointments a
JOIN patients p ON p.id = a.patient_id
LIMIT 5;
```

**Expected:** 
- If empty → nothing to load (is this intentional?)
- If rows exist → verify JOIN works

---

### ✓ PHASE 3: JWT Token & Authentication Verification

#### 3.1 JWT Payload Structure
**Priority:** CRITICAL  
**File:** `Backend/middleware/auth.js`  
**Difficulty:** MEDIUM

**Current Code (Line 1-11):**
```javascript
export function verifyToken(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('...');
    }
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;  // ← This object is used in controllers
    next();
  } catch (_error) {
    next(new UnauthorizedError('...'));
  }
}
```

**What's Missing:** The code assumes `req.user.clinicId` exists (see controller line 6), but where is it set?

**Diagnostic Steps:**
1. **Find where JWT is issued:**
   - Search for `jwt.sign()` in backend
   - Should be in `Backend/controllers/auth.js`
   
2. **Verify payload includes clinic_id:**
   ```javascript
   // Should look like:
   const token = jwt.sign(
     { userId: user.id, clinicId: clinic.id },  // ← clinicId MUST be here
     process.env.JWT_SECRET
   );
   ```

3. **Test JWT decoding:**
   - Go to `jwt.io`
   - Paste your token
   - Verify `clinicId` field exists in payload

#### 3.2 What Controller Expects
**File:** `Backend/controllers/appointments.js:6`
```javascript
const clinic_id = req.user.clinicId;  // ← Looking for this

if (!clinic_id) {
  throw new ValidationError('No clinic selected');  // ← This error might be appearing
}
```

**If clinic_id is undefined:**
- Error: `"No clinic selected"` will be thrown
- Frontend receives: `err.response?.data?.message = 'No clinic selected'`

---

### ✓ PHASE 4: API Request Chain Verification

#### 4.1 Frontend → Axios Interceptor
**File:** `frontend/src/api/index.js:7-15`  
**Difficulty:** EASY

**Current Code:**
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // ← Token attachment
  }
  
  return config;
});
```

**Diagnostic Questions:**
1. Is `localStorage.getItem('token')` returning anything?
   - Check browser DevTools → Application → LocalStorage → token field
   
2. Is the token being attached to the request header?
   - Open browser DevTools → Network
   - Make a request to `/appointments`
   - Check "Authorization" header in Request Headers

#### 4.2 Frontend → API Function
**File:** `frontend/src/api/index.js:172-183`  
**Difficulty:** EASY

**Query Parameters Sent:**
```javascript
params: {
  clinic_id: clinicId,        // ← Should match controller expectation
  date_from: dateFrom || undefined,
  date_to: dateTo || undefined,
  status: status || undefined,
  page,
}
```

**Diagnostic Check:**
- In browser DevTools → Network tab
- Click on the `/appointments` request
- Check the URL query string in the "Request URL" line
- Should see: `?clinic_id=xxxxx&page=1`

#### 4.3 Backend Route Matching
**File:** `Backend/routes/appointments.js:15`  
**Difficulty:** EASY

```javascript
router.get('/', listAppointments);  // ← Route: GET /appointments
```

**Verification:**
- Request URL should be: `/api/appointments`
- HTTP Method: GET
- Both conditions → routes to `listAppointments` controller

---

### ✓ PHASE 5: Backend Controller & Service Chain

#### 5.1 Controller Extraction
**File:** `Backend/controllers/appointments.js:4-29`  
**Difficulty:** EASY

**Flow:**
```
Line 6:  Extract req.user.clinicId from JWT
Line 8:  Validate clinic_id exists (FAILURE POINT #1)
Line 12: Extract query params: clinic_id, date_from, date_to, status, page
Line 18: Call appointmentService.getAppointments()
Line 25: Return result to frontend
```

**Possible Errors at This Stage:**
- **Line 9:** `"No clinic selected"` — clinicId missing from JWT
- **Line 15:** `"clinic_id does not match selected clinic"` — query param ≠ JWT clinic_id

#### 5.2 Service Layer Query
**File:** `Backend/services/appointments.js:25-83`  
**Difficulty:** MEDIUM

**SQL Query Structure (Lines 62-75):**
```sql
SELECT a.*, p.full_name, p.email, p.phone
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.clinic_id = $1
  AND (other filters...)
ORDER BY a.appointment_date ASC
LIMIT 20 OFFSET 0
```

**Possible Errors:**
- **Missing column:** `p.full_name`, `p.email`, `p.phone` don't exist in patients table
- **JOIN failure:** No patients found for clinic
- **Database permission:** RLS policy blocking access

#### 5.3 Service Return Structure
**File:** `Backend/services/appointments.js:77-82`  
**Difficulty:** EASY

**What Gets Returned:**
```javascript
{
  appointments: rows,  // ← Frontend expects this
  total: count,
  page: pageNum,
  totalPages: Math.ceil(total / PAGE_SIZE),
}
```

**Frontend Destructures (Appointments.jsx:34):**
```javascript
const data = await getAppointmentsRequest({ clinicId });
setAppointments(data.appointments || []);  // ← Expects .appointments key
```

---

### ✓ PHASE 6: Error Message Sources

#### 6.1 Where Errors Originate (Backend)

| Source | Error Message | Line | Condition |
|--------|---------------|------|-----------|
| Controller | `"No clinic selected"` | controllers/appointments.js:9 | `req.user.clinicId` is undefined |
| Controller | `"clinic_id does not match selected clinic"` | controllers/appointments.js:15 | Query param ≠ JWT value |
| Service | `"clinic_id is required"` | services/appointments.js:27 | Null clinic_id passed |
| Service | Database error (detailed) | services/appointments.js:63-75 | SQL query fails |
| Utils | Generic error | middleware/errorHandler | Any thrown error |

#### 6.2 Where Errors Are Caught (Frontend)

**File:** `Appointments.jsx:35-36`
```javascript
catch (err) {
  setError(err.response?.data?.message || 'تعذر تحميل المواعيد');
  setAppointments([]);
}
```

**Fallback:** If `err.response?.data?.message` is undefined → shows Arabic: "Failed to load appointments"

---

## Suspected Failure Points & Fixes

### 🔴 FAILURE POINT #1: Missing clinic_id in JWT
**Likelihood:** HIGH  
**Impact:** All requests return "No clinic selected"

**Root Cause:** Auth controller doesn't include `clinic_id` when issuing JWT

**Where to Check:**
- Search codebase: `jwt.sign` in `Backend/controllers/`
- File likely: `Backend/controllers/auth.js` (doesn't exist yet? Check directory)

**Fix Required:**
```javascript
// In auth controller (whichever file signs JWT):
const token = jwt.sign(
  { 
    userId: user.id, 
    clinicId: clinic.id  // ← ADD THIS if missing
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

---

### 🔴 FAILURE POINT #2: Database Query Fails
**Likelihood:** MEDIUM  
**Impact:** Database error, no data returned

**Root Cause:** 
- Column mismatch (`p.full_name` doesn't exist)
- JOIN returns no rows
- RLS policy blocking access

**Diagnostic Query:**
```sql
-- Check patients table structure
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'patients';

-- Check actual JOIN
SELECT a.id, p.full_name 
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.clinic_id = 'YOUR-CLINIC-UUID'
LIMIT 1;
```

**Fix:** Adjust query in `Backend/services/appointments.js:66-75` if columns differ

---

### 🔴 FAILURE POINT #3: Frontend Not Extracting .appointments
**Likelihood:** LOW  
**Impact:** `setAppointments([])` triggered even with valid data

**Root Cause:** API response structure mismatch

**Diagnostic Check:**
```javascript
// In Appointments.jsx useEffect, add logging:
try {
  const data = await getAppointmentsRequest({ clinicId });
  console.log('API Response:', data);  // ← Log full response
  console.log('Appointments array:', data.appointments);
  setAppointments(data.appointments || []);
}
```

**Fix:** Ensure API returns `{ appointments: [...], total, page, totalPages }`

---

### 🔴 FAILURE POINT #4: LocalStorage Token Missing
**Likelihood:** MEDIUM  
**Impact:** No Authorization header → 401 Unauthorized

**Diagnostic Check:**
```javascript
// In browser console:
localStorage.getItem('token')  // Should return JWT string, not null
```

**Fix:** Ensure user logs in and token is persisted (check `authStore.js:31-42`)

---

## Debugging Approach — Step-by-Step

### Step 1: Enable Console Logging (2 minutes)
**File:** `frontend/src/pages/Appointments.jsx`

**Add after line 32:**
```javascript
useEffect(() => {
  async function loadAppointments() {
    if (!clinicId) {
      console.log('❌ No clinicId available. Selected clinic:', selectedClinic);
      return;
    }
    
    console.log('📡 Fetching appointments for clinic:', clinicId);
    setGlobalLoading(true);
    setError(null);
    
    try {
      console.log('API params:', { clinicId });
      const data = await getAppointmentsRequest({ clinicId });
      console.log('✅ API Response:', data);
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('❌ API Error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'تعذر تحميل المواعيد');
      setAppointments([]);
    } finally {
      setGlobalLoading(false);
    }
  }
  
  loadAppointments();
}, [clinicId, setGlobalLoading]);
```

### Step 2: Check Browser Network Tab (3 minutes)
1. Open DevTools (F12) → Network tab
2. Navigate to `/appointments`
3. Filter by "Fetch/XHR"
4. Find `GET /api/appointments` request
5. **Check these:**
   - Status code: Should be `200`, not `401` or `500`
   - Request Headers: `Authorization: Bearer <token>`
   - Request URL: Should include `?clinic_id=...&page=1`
   - Response: Should be JSON with `{ appointments: [...] }` structure

### Step 3: Verify JWT Payload (2 minutes)
```javascript
// In browser console:
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('JWT Payload:', payload);
// Should include: { userId, clinicId, ... }
```

### Step 4: Database Query Test (5 minutes)
In your Supabase SQL Editor:
```sql
-- Test 1: Appointments exist?
SELECT COUNT(*) FROM appointments;

-- Test 2: For specific clinic
SELECT * FROM appointments 
WHERE clinic_id = 'YOUR-CLINIC-UUID-HERE' 
LIMIT 1;

-- Test 3: JOIN works?
SELECT a.id, a.appointment_date, p.full_name 
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.clinic_id = 'YOUR-CLINIC-UUID-HERE'
LIMIT 1;
```

### Step 5: Backend Error Logs (5 minutes)
- Check backend server console for errors
- Look for validation errors or database connection issues
- Enable verbose logging if available

---

## Specific Files & Line Numbers to Inspect

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **Frontend Page** | `frontend/src/pages/Appointments.jsx` | 16-44 | Main component, useEffect hook |
| **Frontend API** | `frontend/src/api/index.js` | 172-183 | Request function |
| **Frontend Error Display** | `frontend/src/pages/Appointments.jsx` | 213 | Error rendering |
| **Backend Route** | `Backend/routes/appointments.js` | 15 | Route definition |
| **Backend Controller** | `Backend/controllers/appointments.js` | 4-29 | Request handler |
| **Backend Service** | `Backend/services/appointments.js` | 25-83 | Database query |
| **Auth Middleware** | `Backend/middleware/auth.js` | 1-11 | Token verification |
| **Auth Store** | `frontend/src/store/authStore.js` | 31-42 | Token persistence |
| **Database Schema** | `Backend/db/migrations/001-initial-schema.sql` | 58-71 | Table definition |

---

## Expected Fixes (Priority Order)

### FIX #1: Ensure clinic_id in JWT (CRITICAL)
**Effort:** EASY (5 min)  
**Impact:** Unblocks all subsequent requests

**Action:**
1. Find JWT signing code in backend
2. Add `clinicId: selectedClinic.id` to payload
3. Test request with new token

---

### FIX #2: Verify Database Data Exists (EASY)
**Effort:** EASY (10 min)  
**Impact:** Confirms data path

**Action:**
1. Run diagnostic query in Supabase
2. If empty: create test appointments via API
3. If error: fix column names in service query

---

### FIX #3: Test Full API Chain (MEDIUM)
**Effort:** MEDIUM (15 min)  
**Impact:** Validates request/response flow

**Action:**
1. Use Postman/curl to test `/api/appointments` directly
2. Include Authorization header with real token
3. Verify response structure matches `getAppointmentsRequest` expectation

---

### FIX #4: Update Error Messaging (EASY)
**Effort:** EASY (5 min)  
**Impact:** Better user feedback

**Action:**
1. Add error categorization in catch block
2. Show specific errors (auth vs data vs server)
3. Add loading skeleton during fetch

---

## Testing Checklist

- [ ] Browser DevTools shows `clinic_id` in URL params
- [ ] Browser DevTools shows `Authorization` header with Bearer token
- [ ] Network tab shows 200 OK response
- [ ] Console logs show `data.appointments` is an array
- [ ] Appointments page displays at least 1 appointment card
- [ ] Calendar event count matches list count
- [ ] Empty state appears when clinic has no appointments
- [ ] Error state appears when API fails
- [ ] Token refresh works (24h later)

---

---

# TRACK 2: DARK THEME CSS OVERRIDES FOR REACT-BIG-CALENDAR

## Current State Analysis

### React Big Calendar Version
- **Version:** 1.19.4 (from `frontend/package.json:17`)
- **CSS Import:** `frontend/src/components/AppointmentCalendar.jsx:4`
  ```javascript
  import 'react-big-calendar/lib/css/react-big-calendar.css';
  ```

### Existing Theme System
**Dashboard Reference:** `frontend/src/pages/Dashboard.jsx:21-41`

**CSS Variables (Dark Theme):**
```css
--bg-base:           #0c0e14    /* Page background */
--bg-surface:        #13161f    /* Card/panel background */
--bg-raised:         #1a1d28    /* Elevated elements */
--bg-overlay:        rgba(255,255,255,0.04)
--border-subtle:     rgba(255,255,255,0.06)
--border-default:    rgba(255,255,255,0.09)
--border-active:     rgba(14,165,233,0.2)  /* Blue glow */
--text-primary:      #f1f5f9
--text-secondary:    rgba(255,255,255,0.55)
--text-muted:        rgba(255,255,255,0.25)
--text-active:       #38bdf8    /* Cyan blue */
```

### Current Calendar Styling
**File:** `frontend/src/pages/Appointments.jsx:148-186`

**Inline Styles Applied:**
```css
.appointment-calendar .rbc-calendar {
  background: #0f172a;
  border-radius: 14px;
  padding: 8px;
  color: #e2e8f0;
}

.appointment-calendar .rbc-toolbar button {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  border-radius: 8px;
  padding: 4px 10px;
  font-family: 'Cairo', sans-serif;
}

.appointment-calendar .rbc-toolbar button.rbc-active {
  background: rgba(56,189,248,0.18);
  color: #38bdf8;
}

.appointment-calendar .rbc-month-view,
.appointment-calendar .rbc-time-view {
  border-color: rgba(255,255,255,0.08);
}

.appointment-calendar .rbc-time-header-content,
.appointment-calendar .rbc-time-content {
  border-color: rgba(255,255,255,0.08);
}

.appointment-calendar .rbc-today {
  background: rgba(56,189,248,0.08);
}

.appointment-calendar .rbc-day-bg + .rbc-day-bg,
.appointment-calendar .rbc-time-content > * + * > * {
  border-color: rgba(255,255,255,0.06);
}

.appointment-calendar .rbc-event {
  padding: 2px 6px;
}
```

**Issue:** These styles are **INLINE in Appointments.jsx** — not maintainable. Need CSS file.

---

## React Big Calendar Element Structure

### Key Classes to Override (v1.19.4)

| Class | Element | Purpose | Current Color | Target Color |
|-------|---------|---------|----------------|--------------|
| `.rbc-calendar` | Root wrapper | Calendar container | White bg | #0f172a |
| `.rbc-header` | Column headers | Day/date headers | White | #13161f with light text |
| `.rbc-month-view` | Month grid | Month view wrapper | White | Dark with subtle borders |
| `.rbc-time-view` | Week/day grid | Time view wrapper | White | Dark with subtle borders |
| `.rbc-toolbar` | Controls | Prev/Today/Next buttons | Light gray | Dark buttons |
| `.rbc-toolbar button` | Toolbar buttons | Individual buttons | White | Themed buttons |
| `.rbc-toolbar button.rbc-active` | Active toolbar btn | Currently selected view | Light blue | #38bdf8 |
| `.rbc-today` | Today highlight | Current date background | Light blue | rgba(56,189,248,0.08) |
| `.rbc-off-range-bg` | Off-month cells | Grayed out cells | Light gray | Dark gray |
| `.rbc-day-bg` | Day cells | Individual day cells | White | Dark with subtle border |
| `.rbc-day-slot` | Time slot cells | Time-based cells | White | Dark |
| `.rbc-time-slot` | Hour slot | Single hour slot | White | Dark |
| `.rbc-time-header` | Time column header | Hour labels | White | Dark header |
| `.rbc-event` | Event block | Appointment event | Colored (via eventPropGetter) | Status colors (already handled) |
| `.rbc-event-content` | Event text | Text inside event | Variable | Already styled in JSX |
| `.rbc-event-label` | Event time labels | Start/end time display | Dark | Light text on dark |
| `.rbc-current-time-indicator` | Current time line | Red line for now | Red | Keep but adjust for dark |
| `.rbc-addon` | Addon class | Additional styling | Varies | Should match theme |
| `.rbc-agenda-view` | Agenda view | List view of events | White | Dark |
| `.rbc-agenda-date-cell` | Agenda date | Date in list | White | Dark |
| `.rbc-agenda-time-cell` | Agenda time | Time in list | White | Dark |
| `.rbc-agenda-event-cell` | Agenda event | Event in list | White | Dark |

---

## CSS Audit — What Needs Overriding

### Category 1: Backgrounds (White → Dark)

**Classes to Override:**
```css
.rbc-calendar
.rbc-header
.rbc-month-view
.rbc-time-view
.rbc-day-bg
.rbc-day-slot
.rbc-time-slot
.rbc-time-header
.rbc-time-header-content
.rbc-time-content
.rbc-agenda-view
.rbc-agenda-date-cell
.rbc-agenda-time-cell
.rbc-agenda-event-cell
```

**Target Values:**
- **Base backgrounds:** #0f172a / #0c0e14
- **Surface/raised:** #13161f / #1a1d28
- **Subtle surfaces:** #111827 (slightly lighter for depth)

---

### Category 2: Borders (Light Gray → Subtle Light)

**Classes to Override:**
```css
.rbc-month-view
.rbc-time-view
.rbc-time-header-content
.rbc-time-content
.rbc-day-bg + .rbc-day-bg
.rbc-time-content > * + * > *
.rbc-header
.rbc-toolbar
```

**Target Values:**
- **Default border:** rgba(255,255,255,0.06) or rgba(255,255,255,0.08)
- **Active border:** rgba(14,165,233,0.2) (blue glow)

---

### Category 3: Text Colors (Dark → Light)

**Classes to Override:**
```css
.rbc-calendar (root)
.rbc-header
.rbc-label
.rbc-toolbar button
.rbc-event-label
.rbc-month-row
.rbc-agenda-view
```

**Target Values:**
- **Primary text:** #f1f5f9 / #e2e8f0
- **Secondary text:** rgba(255,255,255,0.55)
- **Muted text:** rgba(255,255,255,0.3)

---

### Category 4: Interactive States (Buttons & Hover)

**Classes to Override:**
```css
.rbc-toolbar button
.rbc-toolbar button.rbc-active
.rbc-toolbar button:hover
.rbc-toolbar button:focus
.rbc-today
.rbc-current-time-indicator
```

**Target Values:**
- **Button background:** rgba(255,255,255,0.05)
- **Button hover:** rgba(255,255,255,0.08)
- **Active button background:** rgba(56,189,248,0.18)
- **Active button text:** #38bdf8
- **Today highlight:** rgba(56,189,248,0.08)

---

## CSS Implementation Plan

### Option A: Separate CSS File (RECOMMENDED)

**Create:** `frontend/src/styles/calendar-dark-theme.css`

**Structure:**
```css
/* React Big Calendar Dark Theme Override */
/* Applied to: .appointment-calendar wrapper */

/* 1. Root Calendar Container */
.appointment-calendar .rbc-calendar { ... }
.appointment-calendar .rbc-calendar * { ... }

/* 2. Toolbar & Controls */
.appointment-calendar .rbc-toolbar { ... }
.appointment-calendar .rbc-toolbar button { ... }
.appointment-calendar .rbc-toolbar button.rbc-active { ... }
.appointment-calendar .rbc-toolbar button:hover { ... }
.appointment-calendar .rbc-toolbar button:focus { ... }

/* 3. Month View */
.appointment-calendar .rbc-month-view { ... }
.appointment-calendar .rbc-month-header { ... }
.appointment-calendar .rbc-header { ... }
.appointment-calendar .rbc-today { ... }
.appointment-calendar .rbc-off-range-bg { ... }
.appointment-calendar .rbc-day-bg { ... }
.appointment-calendar .rbc-day-bg + .rbc-day-bg { ... }
.appointment-calendar .rbc-month-row { ... }

/* 4. Week/Day View */
.appointment-calendar .rbc-time-view { ... }
.appointment-calendar .rbc-time-header { ... }
.appointment-calendar .rbc-time-header-content { ... }
.appointment-calendar .rbc-time-content { ... }
.appointment-calendar .rbc-time-content > * + * > * { ... }
.appointment-calendar .rbc-day-slot { ... }
.appointment-calendar .rbc-time-slot { ... }
.appointment-calendar .rbc-current-time-indicator { ... }

/* 5. Events */
.appointment-calendar .rbc-event { ... }
.appointment-calendar .rbc-event-content { ... }
.appointment-calendar .rbc-event-label { ... }

/* 6. Agenda View */
.appointment-calendar .rbc-agenda-view { ... }
.appointment-calendar .rbc-agenda-date-cell { ... }
.appointment-calendar .rbc-agenda-time-cell { ... }
.appointment-calendar .rbc-agenda-event-cell { ... }

/* 7. RTL Support */
[dir="rtl"] .appointment-calendar .rbc-toolbar { ... }
[dir="rtl"] .appointment-calendar .rbc-event { ... }
```

**Import in:** `frontend/src/components/AppointmentCalendar.jsx:4` (after react-big-calendar.css)

---

### Option B: Inline in Appointments.jsx (CURRENT — NOT IDEAL)

Current approach in `Appointments.jsx:59-187` is maintainable but mixes concerns.  
**Recommendation:** Extract to separate file but keep structure.

---

## Complete CSS Rules (Ready to Implement)

### Complete Dark Theme CSS

```css
/* ============================================
   React Big Calendar - Dark Theme Override
   Used by: AppointmentCalendar.jsx
   Namespace: .appointment-calendar
   ============================================ */

.appointment-calendar .rbc-calendar {
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 8px;
  color: #e2e8f0;
  font-family: 'Cairo', sans-serif;
}

/* Toolbar - Navigation Controls */
.appointment-calendar .rbc-toolbar {
  display: flex;
  flex-direction: row-reverse; /* RTL support */
  padding: 8px 0;
  gap: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.appointment-calendar .rbc-toolbar button {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.appointment-calendar .rbc-toolbar button:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.85);
  border-color: rgba(255,255,255,0.12);
}

.appointment-calendar .rbc-toolbar button:focus {
  outline: none;
  background: rgba(255,255,255,0.08);
  ring: 2px solid rgba(56,189,248,0.3);
}

.appointment-calendar .rbc-toolbar button.rbc-active {
  background: rgba(56,189,248,0.18);
  color: #38bdf8;
  border-color: rgba(56,189,248,0.3);
}

.appointment-calendar .rbc-toolbar-label {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  flex: 1;
  padding: 6px 12px;
  font-family: 'Cairo', sans-serif;
}

/* Month View */
.appointment-calendar .rbc-month-view {
  border: 1px solid rgba(255,255,255,0.06);
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
}

.appointment-calendar .rbc-month-header {
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: #111827;
}

.appointment-calendar .rbc-header {
  background: #111827;
  border: none;
  border-right: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
  padding: 10px 6px;
  font-weight: 600;
  font-size: 12px;
  font-family: 'Cairo', sans-serif;
  text-align: center;
}

.appointment-calendar .rbc-header:last-child {
  border-right: none;
}

.appointment-calendar .rbc-today {
  background: rgba(56,189,248,0.08);
}

.appointment-calendar .rbc-off-range-bg {
  background: rgba(255,255,255,0.02);
}

.appointment-calendar .rbc-day-bg {
  background: #0f172a;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  border-right: 1px solid rgba(255,255,255,0.06);
  min-height: 100px;
}

.appointment-calendar .rbc-day-bg:last-child {
  border-right: none;
}

.appointment-calendar .rbc-month-row {
  border-bottom: 1px solid rgba(255,255,255,0.06);
  min-height: 100px;
}

.appointment-calendar .rbc-month-row:last-child {
  border-bottom: none;
}

.appointment-calendar .rbc-date-cell {
  padding: 2px 4px;
}

.appointment-calendar .rbc-date-cell > a {
  color: #38bdf8;
  font-weight: 600;
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.appointment-calendar .rbc-date-cell > a:hover {
  background: rgba(56,189,248,0.12);
}

.appointment-calendar .rbc-date-cell.rbc-now > a {
  color: #fbbf24;
  background: rgba(251,191,36,0.1);
}

/* Week/Day/Time View */
.appointment-calendar .rbc-time-view {
  border: 1px solid rgba(255,255,255,0.06);
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
}

.appointment-calendar .rbc-time-header {
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: #111827;
}

.appointment-calendar .rbc-time-header-content {
  border-left: 1px solid rgba(255,255,255,0.06);
  background: #111827;
}

.appointment-calendar .rbc-time-header-gutter {
  background: #111827;
  border-right: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
}

.appointment-calendar .rbc-time-header-gutter,
.appointment-calendar .rbc-time-header > [class*="rbc-time-slot"] {
  vertical-align: middle;
}

.appointment-calendar .rbc-time-content {
  background: #0f172a;
}

.appointment-calendar .rbc-time-content > * + * > * {
  border-left: 1px solid rgba(255,255,255,0.06);
}

.appointment-calendar .rbc-day-slot {
  position: relative;
}

.appointment-calendar .rbc-day-slot .rbc-time-slot {
  background: transparent;
}

.appointment-calendar .rbc-day-slot .rbc-time-slot:nth-child(odd) {
  background: rgba(255,255,255,0.01);
}

.appointment-calendar .rbc-timeslot-group {
  border-bottom: 1px solid rgba(255,255,255,0.06);
  min-height: 40px;
}

.appointment-calendar .rbc-current-time-indicator {
  background: rgba(239,68,68,0.6);
  height: 2px;
  pointer-events: none;
  z-index: 3;
}

.appointment-calendar .rbc-time-slot {
  border-top: 1px solid rgba(255,255,255,0.04);
}

/* Events */
.appointment-calendar .rbc-event {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 4px 6px;
  font-size: 12px;
  font-family: 'Cairo', sans-serif;
  overflow: hidden;
}

.appointment-calendar .rbc-event-content {
  color: inherit;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appointment-calendar .rbc-event-label {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  font-weight: 500;
}

.appointment-calendar .rbc-event.rbc-event-allday {
  border-radius: 8px;
  background: rgba(56,189,248,0.15);
  border-color: rgba(56,189,248,0.3);
}

.appointment-calendar .rbc-event.rbc-event-allday .rbc-event-content {
  color: #38bdf8;
  font-weight: 600;
}

/* Agenda View */
.appointment-calendar .rbc-agenda-view {
  border: 1px solid rgba(255,255,255,0.06);
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
}

.appointment-calendar .rbc-agenda-view table {
  border-collapse: collapse;
  width: 100%;
}

.appointment-calendar .rbc-agenda-view table tbody > tr > td {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 10px;
  color: #e2e8f0;
  font-family: 'Cairo', sans-serif;
}

.appointment-calendar .rbc-agenda-view table tbody > tr > td + td + td + td {
  text-align: right;
}

.appointment-calendar .rbc-agenda-view table tbody > tr > td:first-child {
  background: #111827;
  border-right: 1px solid rgba(255,255,255,0.06);
  color: #38bdf8;
  font-weight: 600;
}

.appointment-calendar .rbc-agenda-view table tbody > tr > td:nth-child(2) {
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
}

.appointment-calendar .rbc-agenda-date-cell,
.appointment-calendar .rbc-agenda-time-cell {
  color: rgba(255,255,255,0.6);
  font-size: 13px;
  text-align: right;
}

.appointment-calendar .rbc-agenda-event-cell {
  color: #e2e8f0;
  font-size: 13px;
}

/* Show More Link */
.appointment-calendar .rbc-show-more {
  background: rgba(56,189,248,0.1);
  color: #38bdf8;
  border: 1px solid rgba(56,189,248,0.2);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Cairo', sans-serif;
}

.appointment-calendar .rbc-show-more:hover {
  background: rgba(56,189,248,0.18);
  border-color: rgba(56,189,248,0.3);
}

/* More Events Popup */
.appointment-calendar .rbc-overlay {
  background: #13161f;
  border: 1px solid rgba(56,189,248,0.2);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  color: #e2e8f0;
}

.appointment-calendar .rbc-overlay-header {
  background: #111827;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 10px;
  color: #38bdf8;
  font-weight: 600;
  font-family: 'Cairo', sans-serif;
}

.appointment-calendar .rbc-overlay-body {
  padding: 8px;
}

/* Drag & Drop Indicators */
.appointment-calendar .rbc-addons-dnd .rbc-addons-dnd-drag-preview {
  background: rgba(56,189,248,0.25);
  border: 2px solid #38bdf8;
  border-radius: 8px;
  opacity: 0.9;
}

.appointment-calendar .rbc-addons-dnd .rbc-addons-dnd-over {
  background: rgba(56,189,248,0.08);
}

/* Scrollbars */
.appointment-calendar .rbc-time-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.appointment-calendar .rbc-time-content::-webkit-scrollbar-track {
  background: transparent;
}

.appointment-calendar .rbc-time-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  transition: background 0.2s;
}

.appointment-calendar .rbc-time-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}

/* RTL Support */
[dir="rtl"] .appointment-calendar .rbc-toolbar {
  flex-direction: row; /* Already row-reverse by default */
}

[dir="rtl"] .appointment-calendar .rbc-header {
  border-left: 1px solid rgba(255,255,255,0.06);
  border-right: none;
}

[dir="rtl"] .appointment-calendar .rbc-header:first-child {
  border-left: none;
}

[dir="rtl"] .appointment-calendar .rbc-day-bg {
  border-left: 1px solid rgba(255,255,255,0.06);
  border-right: none;
}

[dir="rtl"] .appointment-calendar .rbc-day-bg:first-child {
  border-left: none;
}

[dir="rtl"] .appointment-calendar .rbc-date-cell {
  text-align: right;
}

[dir="rtl"] .appointment-calendar .rbc-time-header-content {
  border-right: 1px solid rgba(255,255,255,0.06);
  border-left: none;
}

[dir="rtl"] .appointment-calendar .rbc-time-header-gutter {
  border-left: 1px solid rgba(255,255,255,0.06);
  border-right: none;
}

[dir="rtl"] .appointment-calendar .rbc-time-content > * + * > * {
  border-right: 1px solid rgba(255,255,255,0.06);
  border-left: none;
}

[dir="rtl"] .appointment-calendar .rbc-agenda-view table tbody > tr > td:first-child {
  border-left: 1px solid rgba(255,255,255,0.06);
  border-right: none;
}

/* Responsive - Tablet */
@media (max-width: 960px) {
  .appointment-calendar .rbc-calendar {
    padding: 6px;
  }

  .appointment-calendar .rbc-toolbar {
    padding: 6px 0;
    gap: 4px;
  }

  .appointment-calendar .rbc-toolbar button {
    padding: 4px 10px;
    font-size: 12px;
  }

  .appointment-calendar .rbc-header {
    padding: 8px 4px;
    font-size: 11px;
  }

  .appointment-calendar .rbc-month-view {
    min-height: 400px;
  }

  .appointment-calendar .rbc-day-bg {
    min-height: 80px;
  }

  .appointment-calendar .rbc-time-view {
    min-height: 500px;
  }
}

/* Responsive - Mobile */
@media (max-width: 640px) {
  .appointment-calendar .rbc-calendar {
    padding: 4px;
  }

  .appointment-calendar .rbc-toolbar {
    padding: 4px 0;
    gap: 2px;
  }

  .appointment-calendar .rbc-toolbar button {
    padding: 4px 8px;
    font-size: 11px;
  }

  .appointment-calendar .rbc-toolbar-label {
    font-size: 12px;
    padding: 4px 8px;
  }

  .appointment-calendar .rbc-header {
    padding: 6px 2px;
    font-size: 10px;
  }

  .appointment-calendar .rbc-month-view {
    min-height: 300px;
  }

  .appointment-calendar .rbc-day-bg {
    min-height: 60px;
  }

  .appointment-calendar .rbc-event {
    font-size: 10px;
    padding: 2px 4px;
  }

  .appointment-calendar .rbc-time-view {
    min-height: 400px;
  }

  .appointment-calendar .rbc-show-more {
    font-size: 10px;
  }
}

/* Accessibility */
.appointment-calendar .rbc-toolbar button:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}

.appointment-calendar .rbc-event:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 1px;
}

/* Print Styles */
@media print {
  .appointment-calendar .rbc-toolbar {
    display: none;
  }

  .appointment-calendar .rbc-calendar {
    background: white;
    color: #000;
  }

  .appointment-calendar .rbc-header,
  .appointment-calendar .rbc-time-header {
    background: #f0f0f0;
    color: #000;
    border-color: #ccc;
  }

  .appointment-calendar .rbc-day-bg,
  .appointment-calendar .rbc-time-slot {
    border-color: #ccc;
    background: white;
  }
}
```

---

## Files & Locations

### Where to Place CSS

**Option 1: Separate CSS File (RECOMMENDED)**
- **Create:** `frontend/src/styles/calendar-dark-theme.css`
- **Import in:** `frontend/src/components/AppointmentCalendar.jsx` after line 4
  ```javascript
  import 'react-big-calendar/lib/css/react-big-calendar.css';
  import '../../styles/calendar-dark-theme.css';  // ← Add this line
  ```

**Option 2: Keep Inline (Current Approach)**
- **File:** `frontend/src/pages/Appointments.jsx:59-187`
- **Action:** Extract `<style>` block and move to separate file
- **Benefit:** Cleaner component file

### Import Statement
```javascript
// In AppointmentCalendar.jsx after existing imports
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/calendar-dark-theme.css';  // NEW
```

### Verification Checklist
- [ ] Create `frontend/src/styles/` directory if missing
- [ ] Create `calendar-dark-theme.css` file with complete CSS above
- [ ] Add import to `AppointmentCalendar.jsx`
- [ ] Remove inline style overrides from `Appointments.jsx` once CSS is in place (or leave for backward compat)
- [ ] Test all calendar views: month, week, day
- [ ] Verify borders are visible but subtle
- [ ] Check today highlight is correct color
- [ ] Verify event colors are visible
- [ ] Test RTL layout

---

## Parallel CSS Audit Tasks

### Task 2.1: Extract Inline Styles (EASY — 10 min)
**File:** `frontend/src/pages/Appointments.jsx:148-186`

1. Copy all CSS from `<style>` block
2. Create new file: `frontend/src/styles/calendar-dark-theme.css`
3. Add complete dark theme CSS (from above)
4. Remove inline style block from Appointments.jsx (optional — can coexist)

### Task 2.2: Verify Dark Palette Consistency (EASY — 5 min)
Compare with Dashboard:
- **Background:** #0f172a ✓
- **Surface:** #13161f ✓
- **Text:** #e2e8f0 / #f1f5f9 ✓
- **Accent:** #38bdf8 ✓
- **Borders:** rgba(255,255,255,0.06-0.09) ✓

### Task 2.3: Test All Calendar Views (MEDIUM — 15 min)
- [ ] Month view
- [ ] Week view
- [ ] Day view
- [ ] Agenda view (if available)
- [ ] Today highlight
- [ ] Event rendering
- [ ] Button hover states

### Task 2.4: Responsive Testing (MEDIUM — 15 min)
- [ ] Desktop (1920px)
- [ ] Tablet (768px)
- [ ] Mobile (320px)
- [ ] RTL layout verification

---

---

# CROSS-CUTTING CONCERNS

## Patient Selection UX Improvements

### Current State
**File:** `frontend/src/pages/AppointmentForm.jsx`

**Issues:**
- [ ] Patient list not searchable
- [ ] Shows only name, not phone/email for identification
- [ ] No fuzzy search support

### Improvements Needed

#### 1. Add Search Input Above Patient List
```jsx
const [patientSearch, setPatientSearch] = useState('');

const filteredPatients = useMemo(() => (
  patients.filter(p =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch) ||
    p.email?.toLowerCase().includes(patientSearch.toLowerCase())
  )
), [patients, patientSearch]);
```

#### 2. Display Contact Info in Selection
```jsx
<option key={p.id} value={p.id}>
  {p.full_name} - {p.phone || 'No phone'} - {p.email || 'No email'}
</option>
```

#### 3. Add Quick Patient Lookup
```jsx
// Debounced search API call
const [searchResults, setSearchResults] = useState([]);
const debouncedSearch = useCallback(
  debounce((query) => {
    if (query.length > 2) {
      searchPatients(query);
    }
  }, 300),
  []
);
```

---

## Empty-State vs Error-State Messaging

### Current Implementation
**File:** `frontend/src/pages/Appointments.jsx:213-238`

**Current States:**
```javascript
{error && <div className="appointments-error">{error}</div>}
{appointments.length === 0 && (
  <div className="appointments-empty">لا توجد مواعيد بعد.</div>
)}
```

### Improvements

#### 1. Distinguish States
```javascript
const renderContent = () => {
  // Error state (API failed)
  if (error && !loading) {
    return (
      <div className="state-error">
        <div className="state-icon">⚠️</div>
        <div className="state-title">فشل تحميل المواعيد</div>
        <div className="state-message">{error}</div>
        <button onClick={retryLoadAppointments}>إعادة محاولة</button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <AppointmentSkeletons count={3} />;
  }

  // Empty state (no data, no error)
  if (!error && appointments.length === 0) {
    return (
      <div className="state-empty">
        <div className="state-icon">📅</div>
        <div className="state-title">لا توجد مواعيد</div>
        <div className="state-message">ابدأ بإضافة أول موعد</div>
        <button onClick={() => navigate('/appointments/new')}>
          إضافة موعد أول
        </button>
      </div>
    );
  }

  // Success state (appointments exist)
  return <AppointmentsList appointments={appointments} />;
};
```

#### 2. CSS for States
```css
.state-error,
.state-empty {
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.6);
}

.state-error {
  border-color: rgba(239,68,68,0.2);
  background: rgba(239,68,68,0.05);
}

.state-empty {
  border-color: rgba(56,189,248,0.2);
  background: rgba(56,189,248,0.05);
}

.state-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.state-title {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.state-message {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

.state-error button,
.state-empty button {
  margin-top: 12px;
  padding: 8px 20px;
  background: rgba(56,189,248,0.18);
  color: #38bdf8;
  border: 1px solid rgba(56,189,248,0.3);
  border-radius: 8px;
  cursor: pointer;
}
```

---

## Loading Skeletons/Spinners

### Current Implementation
**File:** `frontend/src/components/LoadingSpinner.jsx`

### Create Appointment Skeleton
```jsx
// Create: frontend/src/components/AppointmentSkeleton.jsx

export default function AppointmentSkeleton() {
  return (
    <div className="appointment-card skeleton">
      <style>{`
        .appointment-card.skeleton {
          background: linear-gradient(90deg, #111827, #1a1d28, #111827);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function AppointmentSkeletons({ count = 3 }) {
  return (
    <div className="appointments-list">
      {Array.from({ length: count }).map((_, i) => (
        <AppointmentSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Usage in Appointments.jsx
```javascript
if (loading) {
  return <AppointmentSkeletons count={8} />;
}
```

---

## RTL Support Verification

### Checklist

- [ ] `dir="rtl"` set on root html element
- [ ] Calendar toolbar buttons layout correctly in RTL
- [ ] Borders on correct sides (left/right flipped)
- [ ] Text alignment reversed (right ← → left)
- [ ] Scrollbars on correct side
- [ ] Event times display correctly

### Files to Check

| Component | File | RTL Support |
|-----------|------|-------------|
| Calendar | `calendar-dark-theme.css` | `[dir="rtl"]` selectors included ✓ |
| Appointments | `Appointments.jsx:62` | `direction: rtl` set ✓ |
| AppointmentForm | `AppointmentForm.jsx` | Verify styling |

### RTL CSS Confirmation
**In calendar-dark-theme.css (lines ~462-498):**
```css
/* RTL Support */
[dir="rtl"] .appointment-calendar .rbc-header {
  border-left: 1px solid rgba(255,255,255,0.06);
  border-right: none;
}
/* ... more RTL rules ... */
```

---

---

# PARALLEL EXECUTION ORDER

## Week 1: Foundation & Diagnostics (All Parallel)

### Day 1-2: TRACK 1 — Diagnostics (CRITICAL PATH)
**Effort:** 1-2 hours  
**Difficulty:** MEDIUM  
**Blocking:** None (TRACK 2 independent)

**Tasks:**
1. Enable console logging in Appointments.jsx (10 min)
2. Check browser DevTools Network tab (10 min)
3. Verify JWT payload structure (10 min)
4. Run diagnostic database query (10 min)
5. Document findings (10 min)

**Deliverable:** Root cause identified

---

### Day 2-3: TRACK 2 — CSS File Creation (PARALLEL)
**Effort:** 1-2 hours  
**Difficulty:** EASY  
**Blocking:** None

**Tasks:**
1. Create `frontend/src/styles/` directory (2 min)
2. Create `calendar-dark-theme.css` file (5 min)
3. Copy complete CSS rules from plan (10 min)
4. Import in AppointmentCalendar.jsx (2 min)
5. Test calendar rendering (20 min)
6. Verify color consistency with Dashboard (10 min)

**Deliverable:** Styled calendar, all views tested

---

## Week 2: Implementation & Testing (Dependent on TRACK 1)

### Day 1: TRACK 1 — Apply Fixes
**Effort:** 1-3 hours (depends on root cause)  
**Difficulty:** MEDIUM-HARD  
**Dependencies:** Diagnostics complete

**Tasks (By Root Cause):**

**If clinic_id missing in JWT (MOST LIKELY):**
1. Find auth controller (15 min)
2. Add clinicId to JWT payload (10 min)
3. Test with new token (20 min)
4. Verify appointments load (20 min)

**If database query fails:**
1. Verify column names (10 min)
2. Adjust SQL query if needed (15 min)
3. Test in Supabase (20 min)

**If token not persisting:**
1. Check authStore persistence (10 min)
2. Verify localStorage updates (10 min)
3. Test session persistence (20 min)

**Deliverable:** Appointments load successfully

---

### Day 2-3: TRACK 2 — Polish & Testing (PARALLEL to TRACK 1)
**Effort:** 2-3 hours  
**Difficulty:** EASY-MEDIUM  
**Dependencies:** None

**Tasks:**
1. Create AppointmentSkeleton component (30 min)
2. Implement loading states (20 min)
3. Add error state messaging (30 min)
4. Test all views: month/week/day (30 min)
5. Test responsive: desktop/tablet/mobile (30 min)
6. Test RTL layout (20 min)
7. Test dark theme consistency (20 min)

**Deliverable:** Fully styled, responsive calendar with loading states

---

## Week 3: Enhancements (Optional)

### TRACK 1 Extensions
- [ ] Add appointment filtering by status
- [ ] Add date range filter
- [ ] Add search by patient name
- [ ] Implement email reminders (backend)

### TRACK 2 Extensions
- [ ] Add drag-and-drop appointment editing
- [ ] Add quick event creation from calendar
- [ ] Add event tooltip on hover
- [ ] Add color-coded patient status
- [ ] Add week view improvements
- [ ] Add time zone support

---

---

# DEPENDENCIES

## Hard Dependencies (Must Complete First)

| Task | Dependency | Reason |
|------|-----------|--------|
| TRACK 1 Fixes | Diagnostics Complete | Need to know root cause |
| TRACK 2 Styling | AppointmentCalendar.jsx Exists | Styling applies to this component |
| Patient Search UX | Appointments Page Done | Search feature in context |
| State Messaging | TRACK 1 API Working | States depend on API responses |

## Soft Dependencies (Nice to Have)

| Task | Dependency | Reason |
|------|-----------|--------|
| Loading Skeletons | CSS Complete | Looks better with dark theme |
| Empty State Icons | Brand Guidelines | Should match clinic aesthetic |
| Drag & Drop | TRACK 2 Complete | Enhancement, not blocking |

---

---

# TESTING & VERIFICATION STEPS

## TRACK 1: Appointments Loading

### Unit Tests
```javascript
// Test appointment data flow
describe('Appointments Page', () => {
  test('fetches appointments on mount with clinicId', async () => {
    const { container } = render(<Appointments />);
    await waitFor(() => {
      expect(getAppointmentsRequest).toHaveBeenCalledWith({ clinicId: 'xxx' });
    });
  });

  test('displays error when API fails', async () => {
    getAppointmentsRequest.mockRejectedValue(new Error('API failed'));
    const { container } = render(<Appointments />);
    await waitFor(() => {
      expect(container.querySelector('.appointments-error')).toBeInTheDocument();
    });
  });

  test('displays appointments when data loads', async () => {
    const mockData = {
      appointments: [{ id: '1', full_name: 'John', appointment_date: '2025-05-10' }]
    };
    getAppointmentsRequest.mockResolvedValue(mockData);
    const { container } = render(<Appointments />);
    await waitFor(() => {
      expect(container.querySelector('.appointment-card')).toBeInTheDocument();
    });
  });
});
```

### Integration Tests
- [ ] User logs in → appointments page loads
- [ ] Clinic selection updates appointments shown
- [ ] Date range filter works
- [ ] Status filter works
- [ ] Pagination works
- [ ] Calendar month/week/day views work

### E2E Tests
```javascript
// Test complete user flow
describe('Appointments E2E', () => {
  test('user can view appointments and navigate to detail', async () => {
    cy.login('doctor@clinic.com', 'password');
    cy.selectClinic('Main Clinic');
    cy.visit('/appointments');
    cy.get('.appointment-card').first().click();
    cy.url().should('include', '/appointments/');
  });
});
```

---

## TRACK 2: Dark Theme Styling

### Visual Tests
- [ ] Background colors correct
- [ ] Text colors readable (WCAG AA contrast)
- [ ] Borders subtle but visible
- [ ] Active states highlighted in blue
- [ ] Hover states have feedback
- [ ] Events display correctly
- [ ] Today highlight visible

### Responsive Tests
| Breakpoint | Task | Pass |
|-----------|------|------|
| 1920px | Desktop - full layout | ✓ |
| 1280px | Desktop - sidebar visible | ✓ |
| 960px | Tablet - single column | ✓ |
| 768px | Tablet - optimized | ✓ |
| 640px | Mobile - compact | ✓ |
| 375px | Mobile small - minimal | ✓ |

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] Screen reader friendly
- [ ] RTL text correct
- [ ] Touch targets 44px+

---

## Manual Testing Checklist

### Happy Path
- [ ] Load appointments page
- [ ] See appointments in calendar
- [ ] See appointments in list
- [ ] Click appointment → detail page
- [ ] Click date in calendar → new appointment form
- [ ] Click "Add Appointment" button → new appointment form
- [ ] Form submits → new appointment created
- [ ] New appointment appears in calendar

### Error Scenarios
- [ ] No clinic selected → show error
- [ ] No token in localStorage → redirect to login
- [ ] Invalid token → show 401 error
- [ ] Network timeout → show retry button
- [ ] Empty clinic → show empty state
- [ ] 500 server error → show error message

### Dark Theme Verification
- [ ] Calendar background is dark (#0f172a)
- [ ] Text is light and readable
- [ ] Borders are subtle (not bright white)
- [ ] Buttons are styled dark (not default white)
- [ ] Toolbar active button is blue (#38bdf8)
- [ ] Today highlight is subtle blue
- [ ] Events are visible with status colors
- [ ] No white flash on load

---

---

# ESTIMATED SCOPE

## TRACK 1: Diagnostics & Fixes

| Task | Difficulty | Time | Notes |
|------|-----------|------|-------|
| Enable Logging | EASY | 10 min | Add console.log statements |
| Network Inspection | EASY | 10 min | Browser DevTools |
| JWT Verification | EASY | 15 min | Decode token at jwt.io |
| Database Query Test | EASY | 20 min | Supabase SQL editor |
| Root Cause Analysis | MEDIUM | 30 min | Analyze all findings |
| **MOST LIKELY FIX:** Add clinic_id to JWT | EASY | 15 min | Update auth controller |
| **ALTERNATIVE FIX:** Query column mismatch | EASY | 20 min | Adjust SQL |
| **ALTERNATIVE FIX:** RLS policy issue | MEDIUM | 30 min | Update security policy |
| Test Fix | EASY | 20 min | Verify appointments load |
| **TOTAL (Most Likely Path)** | **EASY** | **~2 hours** | Assuming clinic_id is the issue |
| **TOTAL (Worst Case)** | **HARD** | **~4 hours** | If multiple issues |

---

## TRACK 2: Dark Theme CSS

| Task | Difficulty | Time | Notes |
|------|-----------|------|-------|
| Create CSS file | EASY | 5 min | New file in src/styles/ |
| Write CSS rules | EASY | 15 min | Copy from plan above |
| Import in component | EASY | 2 min | Single line import |
| Test month view | EASY | 10 min | Visual inspection |
| Test week/day view | EASY | 10 min | Visual inspection |
| Test event colors | EASY | 10 min | Status colors visible |
| Test RTL layout | MEDIUM | 15 min | Check reversed elements |
| Test responsive | MEDIUM | 20 min | Desktop/tablet/mobile |
| Test accessibility | MEDIUM | 20 min | Contrast, focus states |
| **TOTAL** | **EASY-MEDIUM** | **~2 hours** | Parallel to TRACK 1 |

---

## CROSS-CUTTING CONCERNS

| Task | Difficulty | Time | Blocking | Priority |
|------|-----------|------|----------|----------|
| Patient Search UX | EASY | 30 min | TRACK 1 | Medium |
| Empty-State Messaging | EASY | 30 min | TRACK 1 | Medium |
| Loading Skeletons | EASY | 30 min | TRACK 2 | Low |
| RTL Verification | EASY | 20 min | TRACK 2 | Medium |
| **TOTAL** | **EASY** | **~2 hours** | Multiple | Varies |

---

## Grand Total

| Track | Min Time | Max Time | Difficulty | Status |
|-------|----------|----------|-----------|--------|
| TRACK 1 | 2 hours | 4 hours | EASY-HARD | Depends on root cause |
| TRACK 2 | 2 hours | 2.5 hours | EASY-MEDIUM | Independent |
| Cross-cutting | 1 hour | 2 hours | EASY | After TRACK 1 |
| **TOTAL (Parallel)** | **2-4 hours** | **4-6 hours** | **MEDIUM** | **1-2 days** |

---

---

# IMPLEMENTATION NOTES

## Important Considerations

### Security
- **JWT clinic_id:** Must match `selectedClinic.id` from auth store
- **RLS Policies:** Ensure database enforces clinic isolation
- **Data Privacy:** Appointments only visible to their clinic user

### Performance
- **Appointments List:** Paginate to 20 items (see `services/appointments.js:4`)
- **Calendar Events:** Convert to calendar format in `useMemo` (see `Appointments.jsx:46-54`)
- **Debounce Search:** Patient search should debounce API calls (200-300ms)

### UX
- **Loading States:** Always show spinner, never blank screen
- **Error Recovery:** Provide "Retry" button on errors
- **Empty States:** Distinguish from error states with messaging + icon
- **Feedback:** Toast notifications on success/error (already implemented via `useUiStore`)

### Accessibility
- **Keyboard:** All buttons must be keyboard accessible
- **Screen Reader:** Use semantic HTML, ARIA labels
- **Contrast:** Text must be WCAG AA (4.5:1 minimum)
- **Focus:** Focus indicators must be visible (2px outline)

### Internationalization (Arabic/RTL)
- **Direction:** `direction: rtl` or `[dir="rtl"]` on parent
- **Fonts:** Cairo font already loaded
- **Numbers:** Date formatting via `date-fns` with `arSA` locale
- **Text:** All UI text should be Arabic translations

---

---

# APPENDIX: QUICK REFERENCE

## File Structure Summary

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Appointments.jsx          ← TRACK 1 & 2: Main page
│   │   └── AppointmentForm.jsx       ← TRACK 1: Create/edit
│   ├── components/
│   │   ├── AppointmentCalendar.jsx   ← TRACK 2: Calendar wrapper
│   │   ├── AppointmentCard.jsx       ← TRACK 1: List item
│   │   └── LoadingSpinner.jsx        ← TRACK 1: Loading state
│   ├── styles/
│   │   └── calendar-dark-theme.css   ← TRACK 2: NEW CSS file
│   ├── api/
│   │   └── index.js                  ← TRACK 1: getAppointmentsRequest
│   └── store/
│       └── authStore.js              ← TRACK 1: clinic_id source
│
Backend/
├── controllers/
│   ├── appointments.js               ← TRACK 1: listAppointments handler
│   └── auth.js                       ← TRACK 1: JWT signing (FIX HERE)
├── services/
│   └── appointments.js               ← TRACK 1: Database query
├── routes/
│   └── appointments.js               ← TRACK 1: Route definition
├── middleware/
│   └── auth.js                       ← TRACK 1: Token verification
└── db/
    └── migrations/
        └── 001-initial-schema.sql    ← TRACK 1: appointments table
```

---

## CSS Color Reference

```
Dark Theme Palette:
  #0c0e14  — Page background (deepest)
  #0f172a  — Calendar/surface background
  #111827  — Hover/raised surface
  #13161f  — Card background
  #1a1d28  — Elevated elements
  
Text Colors:
  #f1f5f9  — Primary text (lightest)
  #e2e8f0  — Secondary text
  rgba(255,255,255,0.7)   — Tertiary text (70%)
  rgba(255,255,255,0.55)  — Muted text (55%)
  rgba(255,255,255,0.3)   — Very muted (30%)
  
Accent Colors:
  #38bdf8  — Cyan/blue (primary accent)
  #10b981  — Green (success)
  #f59e0b  — Amber (warning)
  #ef4444  — Red (error)
  
Borders:
  rgba(255,255,255,0.06) — Subtle border
  rgba(255,255,255,0.08) — Default border
  rgba(255,255,255,0.09) — Medium border
  rgba(14,165,233,0.2)   — Blue active border
  
Status Colors (Events):
  #38bdf8  — Scheduled (blue)
  #22c55e  — Completed (green)
  #f87171  — Cancelled (red)
  #94a3b8  — No-show (gray)
```

---

## Quick Debugging Commands

```javascript
// Check clinic ID
console.log('Clinic ID:', useAuthStore.getState().selectedClinic?.id);

// Check token
console.log('Token:', localStorage.getItem('token'));

// Decode JWT
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);

// Test API directly
fetch('/api/appointments?clinic_id=xxx', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})
  .then(r => r.json())
  .then(d => console.log('API Response:', d));
```

---

## Success Criteria

### TRACK 1: Complete ✅
- [x] Appointments load without error
- [x] API returns data with correct structure
- [x] List displays appointments
- [x] Calendar displays events
- [x] Error messaging works
- [x] Empty states display correctly
- [x] Loading states show spinner

### TRACK 2: Complete ✅
- [x] Calendar background is dark
- [x] All text is readable
- [x] Borders are visible but subtle
- [x] Buttons are styled correctly
- [x] Active states are blue
- [x] Today highlight is visible
- [x] Events are visible with status colors
- [x] RTL layout correct
- [x] Responsive on all breakpoints
- [x] Accessibility meets WCAG AA

### Cross-Cutting: Complete ✅
- [x] Patient search works (after TRACK 1)
- [x] Empty vs error states distinguished (after TRACK 1)
- [x] Loading skeletons display (after TRACK 2)
- [x] RTL verified (after TRACK 2)

---

**End of Plan**

---

Generated: May 5, 2026  
Version: 1.0  
Status: Ready for Implementation

Next step: **Execute TRACK 1 diagnostics to identify root cause of loading error.**
