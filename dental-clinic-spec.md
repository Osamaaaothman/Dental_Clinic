# Dental Clinic Management System — Project Specification

## Overview

A full-stack web application for managing a private dental clinic. The system is used exclusively by one user (the clinic owner/doctor), who manages two separate clinics. The system is not public-facing and does not require SEO.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | SPA, no SSR needed |
| UI Library | DaisyUI (Tailwind) | Component styling |
| State Management | Zustand | Global app state |
| Backend | Node.js + Express | REST API |
| Database | PostgreSQL via Supabase | Managed, free tier |
| File Storage | Cloudinary | Images, X-rays, documents |
| Email | Resend | Appointment reminders |
| Frontend Hosting | Vercel | Free tier |
| Backend Hosting | Railway | Free tier |

---

## Backend Architecture

The backend follows a **Layered Architecture** (Routes → Controllers → Services → DB). Each layer has one responsibility. No over-engineering — this pattern fits a single-user app perfectly and keeps the codebase easy to maintain and extend.

### Layer Responsibilities

```
client request
      ↓
  [ Routes ]        — define endpoints, apply middleware (auth check)
      ↓
  [ Controllers ]   — handle request/response, input validation
      ↓
  [ Services ]      — business logic, DB queries
      ↓
  [ DB (Supabase) ] — PostgreSQL
```

### Concrete Example — creating a session

```
POST /api/patients/:id/sessions
      ↓
routes/sessions.js        → applies verifyToken middleware, calls SessionController.create
      ↓
controllers/sessions.js   → validates body fields, calls SessionService.create(data)
      ↓
services/sessions.js      → runs DB queries:
                              1. INSERT into sessions
                              2. UPDATE teeth status for each treated tooth
                              3. INSERT into tooth_history for each changed tooth
      ↓
db/index.js               → executes SQL against Supabase
```

### Folder Structure (server)

```
server/
├── index.js                  # Express app setup, middleware, route mounting
├── db/
│   └── index.js              # pg Pool connected to Supabase DATABASE_URL
├── middleware/
│   └── auth.js               # verifyToken — checks JWT, attaches user to req
├── routes/
│   ├── auth.js
│   ├── patients.js
│   ├── teeth.js
│   ├── sessions.js
│   ├── appointments.js
│   ├── attachments.js
│   └── finance.js
├── controllers/
│   ├── auth.js
│   ├── patients.js
│   ├── teeth.js
│   ├── sessions.js
│   ├── appointments.js
│   ├── attachments.js
│   └── finance.js
├── services/
│   ├── patients.js
│   ├── teeth.js
│   ├── sessions.js
│   ├── appointments.js
│   ├── attachments.js
│   ├── finance.js
│   ├── cloudinary.js         # Cloudinary upload helper
│   ├── resend.js             # Email sending helper
│   └── reminderCron.js       # node-cron job for appointment reminders
└── utils/
    └── errors.js             # Custom error classes (NotFoundError, ValidationError)
```

### Key Rules for the Backend

1. **Controllers never touch the DB directly** — all queries go through services.
2. **Services never touch req/res** — they only receive plain data and return plain data.
3. **Every route is protected** by `verifyToken` middleware except `/api/auth/login`.
4. **Every query includes `clinic_id`** to isolate the two clinics.
5. **Error handling** — wrap all async route handlers in a try/catch, use a global error handler in `index.js`.

### No Caching Needed

This app has a single user and data changes frequently (new sessions, appointments, tooth updates). Caching adds complexity with no real benefit here. The only "cache" used is Zustand on the frontend to avoid re-fetching static data like the clinic list within the same session.

---

## Authentication

- Single user login (the doctor)
- JWT-based authentication
- On login → user selects which clinic to work in (Clinic 1 or Clinic 2)
- All subsequent data is scoped to the selected clinic
- Session persists until logout

---

## Database Schema

### `clinics`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        VARCHAR(255) NOT NULL
location    VARCHAR(255)
created_at  TIMESTAMP DEFAULT now()
```

### `users`
```sql
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
email          VARCHAR(255) UNIQUE NOT NULL
password_hash  TEXT NOT NULL
created_at     TIMESTAMP DEFAULT now()
```

### `patients`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
clinic_id   UUID REFERENCES clinics(id)
full_name   VARCHAR(255) NOT NULL
birth_date  DATE
gender      VARCHAR(10)        -- 'male' | 'female'
phone       VARCHAR(20)
email       VARCHAR(255)
blood_type  VARCHAR(5)         -- 'A+', 'B-', etc.
allergies   TEXT               -- drug allergies, important before anesthesia
notes       TEXT
created_at  TIMESTAMP DEFAULT now()
```

### `teeth`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id    UUID REFERENCES patients(id)
tooth_number  INT NOT NULL     -- FDI notation: 11–18, 21–28, 31–38, 41–48
status        VARCHAR(50)      -- 'unknown' | 'healthy' | 'cavity' | 'treated' | 'crown' | 'implant' | 'root_canal' | 'missing'
color_code    VARCHAR(10)      -- hex color for UI rendering
notes         TEXT
updated_at    TIMESTAMP DEFAULT now()
```

> When a new patient is added, automatically INSERT 32 rows into `teeth` (all tooth numbers per FDI system) with status = `'unknown'`.

**FDI Tooth Numbering:**
- Upper right: 18, 17, 16, 15, 14, 13, 12, 11
- Upper left:  21, 22, 23, 24, 25, 26, 27, 28
- Lower left:  31, 32, 33, 34, 35, 36, 37, 38
- Lower right: 48, 47, 46, 45, 44, 43, 42, 41

### `sessions`
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id        UUID REFERENCES patients(id)
clinic_id         UUID REFERENCES clinics(id)
session_date      DATE NOT NULL
chief_complaint   TEXT           -- patient's main complaint
diagnosis         TEXT
treatment_done    TEXT           -- procedures performed
teeth_treated     JSONB          -- array of tooth numbers e.g. [16, 36]
medications       TEXT           -- prescriptions / instructions
next_visit_notes  TEXT           -- notes for next appointment
amount_charged    DECIMAL(10,2) DEFAULT 0
amount_paid       DECIMAL(10,2) DEFAULT 0
payment_method    VARCHAR(20)    -- 'cash' | 'card' | 'insurance'
payment_status    VARCHAR(20)    -- 'paid' | 'partial' | 'pending'
created_at        TIMESTAMP DEFAULT now()
```

### `appointments`
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id          UUID REFERENCES patients(id)
clinic_id           UUID REFERENCES clinics(id)
session_id          UUID REFERENCES sessions(id) NULL   -- linked after session is created
appointment_date    TIMESTAMP NOT NULL
duration_minutes    INT DEFAULT 30
type                VARCHAR(50)   -- 'checkup' | 'followup' | 'extraction' | 'cleaning' | 'filling' | 'root_canal' | 'crown' | 'implant' | 'other'
status              VARCHAR(20)   -- 'scheduled' | 'completed' | 'cancelled' | 'no_show'
doctor_notes        TEXT
reminder_1h_sent    BOOLEAN DEFAULT false
reminder_24h_sent   BOOLEAN DEFAULT false
created_at          TIMESTAMP DEFAULT now()
```

### `attachments`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id   UUID REFERENCES patients(id)
session_id   UUID REFERENCES sessions(id) NULL   -- NULL means attached to patient, not a session
file_url     TEXT NOT NULL        -- Cloudinary URL
file_type    VARCHAR(20)          -- 'xray' | 'photo' | 'document' | 'other'
description  TEXT
uploaded_at  TIMESTAMP DEFAULT now()
```

> `session_id` can be NULL. This allows attaching files directly to a patient (e.g. old records from another clinic) without linking them to a specific session.

### `tooth_history`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
tooth_id    UUID REFERENCES teeth(id)
session_id  UUID REFERENCES sessions(id)
old_status  VARCHAR(50)
new_status  VARCHAR(50)
notes       TEXT
changed_at  TIMESTAMP DEFAULT now()
```

> Every time a tooth's status changes, insert a row here. This provides a full audit trail of dental changes per session.

---

## Relationships Summary

```
clinics
  └── patients (clinic_id)
  └── sessions (clinic_id)
  └── appointments (clinic_id)

patients
  └── teeth (patient_id)           -- 32 rows auto-created on patient insert
  └── sessions (patient_id)
  └── appointments (patient_id)
  └── attachments (patient_id)     -- session_id can be NULL

sessions
  └── tooth_history (session_id)
  └── attachments (session_id)
  └── appointments (session_id)    -- optional link after session

teeth
  └── tooth_history (tooth_id)
```

---

## Pages & Routes

### Auth
- `GET /login` — Login page

### Clinic Selection
- `GET /select-clinic` — After login, choose Clinic 1 or Clinic 2

### Dashboard
- `GET /dashboard` — Main overview
  - Today's appointments
  - Quick stats: total patients, today's revenue, pending payments
  - Recent activity feed

### Patients
- `GET /patients` — Patient list with search and filters
- `GET /patients/new` — Add new patient form
- `GET /patients/:id` — Patient profile
  - Tab 1: Personal info + edit
  - Tab 2: Teeth chart (interactive FDI diagram, click tooth → view/edit status)
  - Tab 3: Sessions list
  - Tab 4: Attachments (files not linked to a session)
- `GET /patients/:id/sessions/new` — Create new session for patient
- `GET /patients/:id/sessions/:sessionId` — Session details + edit

### Appointments
- `GET /appointments` — Calendar view (day / week / month toggle)
- `GET /appointments/new` — Add appointment
- `GET /appointments/:id` — Appointment details, edit, cancel

### Finance
- `GET /finance` — Financial dashboard
  - Total revenue (daily / monthly / yearly)
  - Collection rate
  - Pending payments list
  - Breakdown by payment method
- `GET /finance/patients` — Per-patient financial summary (charged, paid, balance)

### Settings
- `GET /settings` — Settings page
  - Clinic info (name, location)
  - Email configuration (Resend API key, sender name)
  - Change password

---

## Feature Details

### Teeth Chart (UI)
- Render all 32 teeth as clickable SVG elements
- Color each tooth based on its `status` field
- Color map:
  - `unknown`    → gray (#9ca3af)
  - `healthy`    → green (#22c55e)
  - `cavity`     → red (#ef4444)
  - `treated`    → orange (#f97316)
  - `crown`      → purple (#8b5cf6)
  - `root_canal` → blue (#3b82f6)
  - `missing`    → dark gray (#4b5563)
  - `implant`    → yellow (#eab308)
- Clicking a tooth opens a panel showing: current status, notes, full history from `tooth_history`
- Doctor can update status → triggers INSERT into `tooth_history` and UPDATE on `teeth`

### Session Creation
- Select patient
- Pick date
- Fill: chief complaint, diagnosis, treatment done
- Select teeth worked on (from the teeth chart, multi-select)
- Medications / instructions
- Financial: amount charged, amount paid, payment method
- Upload attachments (X-rays, photos) → Cloudinary
- On save: update selected teeth statuses, insert into `tooth_history`

### Appointments & Reminders
- Doctor creates appointment with date/time, duration, type, notes
- Cron job runs every 15 minutes (on Railway):
  - Finds appointments where `appointment_date` is within 24 hours AND `reminder_24h_sent = false` → send email to doctor + patient (if email exists) → set flag to true
  - Finds appointments within 1 hour AND `reminder_1h_sent = false` → send email → set flag to true
- Email sent via Resend

### File Attachments
- Upload to Cloudinary, store returned URL in `attachments` table
- Two attachment contexts:
  1. **Session attachment**: `session_id` is set
  2. **Patient attachment**: `session_id` is NULL (e.g. old X-rays, referral letters)
- Supported file types: images (JPEG, PNG), PDF, DICOM (if possible)
- Patient profile shows all attachments (both types) in one view

### Financial Reports
- Per-patient: total charged, total paid, remaining balance, list of payments per session
- Clinic-wide: revenue by day/month/year, collection rate %, pending totals, breakdown by payment method (cash/card/insurance)

---

## API Endpoints (Express)

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Clinics
```
GET    /api/clinics
```

### Patients
```
GET    /api/patients?clinic_id=&search=&page=
POST   /api/patients
GET    /api/patients/:id
PUT    /api/patients/:id
DELETE /api/patients/:id
```

### Teeth
```
GET    /api/patients/:id/teeth
PUT    /api/teeth/:toothId          -- update status
GET    /api/teeth/:toothId/history  -- tooth_history for one tooth
```

### Sessions
```
GET    /api/patients/:id/sessions
POST   /api/patients/:id/sessions
GET    /api/sessions/:id
PUT    /api/sessions/:id
DELETE /api/sessions/:id
```

### Appointments
```
GET    /api/appointments?clinic_id=&date=&status=
POST   /api/appointments
GET    /api/appointments/:id
PUT    /api/appointments/:id
DELETE /api/appointments/:id
```

### Attachments
```
GET    /api/patients/:id/attachments
POST   /api/attachments              -- multipart/form-data, upload to Cloudinary
DELETE /api/attachments/:id
```

### Finance
```
GET    /api/finance/summary?clinic_id=&period=day|month|year
GET    /api/finance/patients?clinic_id=
GET    /api/finance/patients/:patientId
```

---

## Environment Variables

### Backend (.env)
```
PORT=3000
DATABASE_URL=postgresql://...         # Supabase connection string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=clinic@yourdomain.com
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

---

## Project Folder Structure

```
/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── SelectClinic.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── patients/
│   │   │   │   ├── PatientList.jsx
│   │   │   │   ├── PatientProfile.jsx
│   │   │   │   ├── NewPatient.jsx
│   │   │   │   ├── NewSession.jsx
│   │   │   │   └── SessionDetail.jsx
│   │   │   ├── appointments/
│   │   │   │   ├── AppointmentCalendar.jsx
│   │   │   │   └── AppointmentDetail.jsx
│   │   │   ├── finance/
│   │   │   │   └── FinanceDashboard.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── TeethChart.jsx       # Interactive SVG teeth diagram
│   │   │   ├── ToothPanel.jsx       # Tooth detail + history panel
│   │   │   ├── AttachmentUpload.jsx
│   │   │   ├── AppointmentCard.jsx
│   │   │   └── Navbar.jsx
│   │   ├── store/
│   │   │   ├── authStore.js         # Zustand: user + clinic selection
│   │   │   ├── patientStore.js
│   │   │   └── appointmentStore.js
│   │   ├── api/
│   │   │   └── index.js             # Axios instance + all API calls
│   │   └── App.jsx
│   └── package.json
│
├── server/                          # Express backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── teeth.js
│   │   ├── sessions.js
│   │   ├── appointments.js
│   │   ├── attachments.js
│   │   └── finance.js
│   ├── middleware/
│   │   └── auth.js                  # JWT verification middleware
│   ├── services/
│   │   ├── cloudinary.js
│   │   ├── resend.js
│   │   └── reminderCron.js          # Cron job for email reminders
│   ├── db/
│   │   └── index.js                 # Supabase/pg connection
│   └── index.js
│
└── README.md
```

---

## Development Phases

### Phase 1 — Foundation
- [ ] Supabase project setup + all tables created
- [ ] Express server with DB connection
- [ ] JWT login/logout
- [ ] Clinic selection after login
- [ ] Protected routes

### Phase 2 — Patients & Teeth
- [ ] Patient CRUD
- [ ] Auto-create 32 teeth on patient insert
- [ ] Interactive teeth chart (SVG, color by status)
- [ ] Update tooth status + tooth_history insert

### Phase 3 — Sessions
- [ ] Create/edit/view sessions
- [ ] Link teeth worked on per session
- [ ] File upload to Cloudinary (session + patient level)
- [ ] Financial fields per session

### Phase 4 — Appointments & Reminders
- [ ] Appointment CRUD
- [ ] Calendar view
- [ ] Cron job for reminders
- [ ] Email via Resend (doctor + patient)

### Phase 5 — Finance & Reports
- [ ] Per-patient financial summary
- [ ] Clinic-wide revenue dashboard
- [ ] Filter by date range

### Phase 6 — Polish
- [ ] Settings page
- [ ] Supabase keep-alive ping (prevent free tier pause)
- [ ] Mobile-friendly layout review
- [ ] Error handling + loading states

---

## Important Notes for Development

1. **Always scope queries by `clinic_id`** — every data-fetching query must include the currently selected clinic to keep the two clinics fully isolated.

2. **Teeth are created once per patient** — do not create new teeth rows per session. Update existing rows and log changes to `tooth_history`.

3. **Attachments have two modes** — always check whether `session_id` is present or null when inserting/displaying attachments.

4. **Reminders use flags** — `reminder_1h_sent` and `reminder_24h_sent` prevent duplicate emails. Never send if flag is already true.

5. **Supabase free tier** — add a keep-alive cron that pings the DB every 2 days to prevent the project from pausing due to inactivity.

6. **No public registration** — there is no sign-up flow. The single user account is created manually or via a seed script.
