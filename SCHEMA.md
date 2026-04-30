# Dental Clinic System — Database Schema
> PostgreSQL via Supabase · 9 Tables · UUID primary keys

---

## Quick Reference

| Table | Purpose | Key Relations |
|---|---|---|
| `clinics` | Root table — every record belongs to a clinic | Parent of patients, sessions, appointments |
| `users` | Doctor account (one per clinic) | Standalone auth table |
| `patients` | Patient records | Belongs to clinic · Has teeth, sessions, appointments, attachments |
| `teeth` | 32 teeth per patient (FDI system) | Belongs to patient · Has tooth_history |
| `sessions` | Clinical visit records (medical + financial) | Belongs to patient + clinic · Has tooth_history, attachments, payments |
| `appointments` | Scheduled visits with email reminders | Belongs to patient + clinic · Links to session after completion |
| `attachments` | X-rays, photos, documents (Cloudinary) | Belongs to patient · Optionally linked to a session |
| `tooth_history` | Audit log for every tooth status change | Belongs to tooth + session |
| `payments` | Individual payment installments per session | Belongs to session + patient |

---

## Tables

### `clinics`
> Root table. Everything in the system belongs to a clinic.

```sql
id          UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
name        VARCHAR(255)  NOT NULL
location    VARCHAR(255)
created_at  TIMESTAMP     DEFAULT now()
```

---

### `users`
> Doctor authentication. One account per clinic (single-user system for now).

```sql
id             UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
email          VARCHAR(255)  UNIQUE NOT NULL
password_hash  TEXT          NOT NULL     -- bcrypt
created_at     TIMESTAMP     DEFAULT now()
```

---

### `patients`
> Core patient profile. Linked to a clinic.
> ⚡ Inserting a new patient should trigger auto-creation of 32 rows in `teeth`.

```sql
id          UUID          PRIMARY KEY
clinic_id   UUID          NOT NULL  REFERENCES clinics(id) ON DELETE CASCADE
full_name   VARCHAR(255)  NOT NULL
birth_date  DATE
gender      VARCHAR(10)             -- 'male' | 'female'
phone       VARCHAR(20)
email       VARCHAR(255)            -- used for appointment reminders
blood_type  VARCHAR(5)              -- 'A+' | 'B-' | 'O+' | 'AB+' | etc.
allergies   TEXT                    -- CRITICAL: check before anesthesia
notes       TEXT
created_at  TIMESTAMP     DEFAULT now()
```

---

### `teeth`
> 32 teeth per patient, auto-created on patient insert using FDI numbering.
> Used to render the interactive tooth chart in the UI.

```sql
id            UUID         PRIMARY KEY
patient_id    UUID         NOT NULL  REFERENCES patients(id) ON DELETE CASCADE
tooth_number  INT          NOT NULL  -- FDI: 11-18, 21-28, 31-38, 41-48
status        VARCHAR(50)  DEFAULT 'unknown'
              -- ENUM: 'unknown' | 'healthy' | 'cavity' | 'treated'
              --       'crown' | 'implant' | 'root_canal' | 'missing'
color_code    VARCHAR(10)            -- hex color for UI rendering e.g. '#22C55E'
notes         TEXT
updated_at    TIMESTAMP    DEFAULT now()

UNIQUE(patient_id, tooth_number)
```

**FDI Numbering:**
```
Upper Right (Q1): 18 17 16 15 14 13 12 11
Upper Left  (Q2): 21 22 23 24 25 26 27 28
Lower Left  (Q3): 31 32 33 34 35 36 37 38
Lower Right (Q4): 48 47 46 45 44 43 42 41
```

---

### `sessions`
> Full record of a clinical visit — medical notes, treatment done, and financial summary.
> `amount_paid` is now REMOVED — computed from the `payments` table instead.
> `payment_status` is computed: SUM(payments.amount) vs amount_charged.

```sql
id                UUID            PRIMARY KEY
patient_id        UUID            NOT NULL  REFERENCES patients(id)
clinic_id         UUID            NOT NULL  REFERENCES clinics(id)
session_date      DATE            NOT NULL
chief_complaint   TEXT                      -- patient's main complaint in their own words
diagnosis         TEXT                      -- doctor's diagnosis
treatment_done    TEXT                      -- procedure performed
teeth_treated     JSONB                     -- array of FDI numbers e.g. [16, 36]
medications       TEXT                      -- prescription and instructions
next_visit_notes  TEXT                      -- instructions for next visit
amount_charged    DECIMAL(10,2)   DEFAULT 0
payment_status    VARCHAR(20)     DEFAULT 'pending'
                  -- 'paid' | 'partial' | 'pending'
                  -- ⚡ Update this whenever a payment is added
created_at        TIMESTAMP       DEFAULT now()
```

> 💡 **Removed from sessions:** `amount_paid`, `payment_method`
> These now live in the `payments` table.
>
> 💡 **Computed values (never stored):**
> - `amount_paid  = SELECT COALESCE(SUM(amount), 0) FROM payments WHERE session_id = ?`
> - `balance      = amount_charged - amount_paid`
> - `payment_status` should be kept in sync when payments change:
>   - balance = 0 → `'paid'`
>   - balance > 0 AND amount_paid > 0 → `'partial'`
>   - amount_paid = 0 → `'pending'`

---

### `payments`
> Each row = one payment installment made by the patient.
> A session can have zero, one, or many payments.
> NEVER update or delete — append only (use a reversal/refund row if needed).

```sql
id             UUID           PRIMARY KEY  DEFAULT gen_random_uuid()
session_id     UUID           NOT NULL  REFERENCES sessions(id) ON DELETE CASCADE
patient_id     UUID           NOT NULL  REFERENCES patients(id)
clinic_id      UUID           NOT NULL  REFERENCES clinics(id)
amount         DECIMAL(10,2)  NOT NULL  CHECK (amount != 0)
               -- positive = payment received
               -- negative = refund/reversal
payment_method VARCHAR(20)    NOT NULL
               -- 'cash' | 'card' | 'insurance'
payment_date   TIMESTAMP      DEFAULT now()
notes          TEXT           -- e.g. 'First installment', 'Insurance reimbursement'
created_at     TIMESTAMP      DEFAULT now()
```

> ⚠️ **Append-only rule:** To issue a refund, insert a row with a negative `amount`.
> Never update or delete existing payment rows — they form an audit trail.

---

### `appointments`
> Scheduled visits. Supports email reminders at 24h and 1h before.
> Becomes linked to a `session` after the doctor completes the visit.

```sql
id                  UUID         PRIMARY KEY
patient_id          UUID         NOT NULL  REFERENCES patients(id)
clinic_id           UUID         NOT NULL  REFERENCES clinics(id)
session_id          UUID                   REFERENCES sessions(id)  -- NULL until visit is completed
appointment_date    TIMESTAMP    NOT NULL
duration_minutes    INT          DEFAULT 30
type                VARCHAR(50)
                    -- 'checkup' | 'followup' | 'extraction' | 'cleaning'
                    -- 'filling' | 'root_canal' | 'crown' | 'implant' | 'other'
status              VARCHAR(20)  DEFAULT 'scheduled'
                    -- 'scheduled' | 'completed' | 'cancelled' | 'no_show'
doctor_notes        TEXT
reminder_24h_sent   BOOLEAN      DEFAULT false
reminder_1h_sent    BOOLEAN      DEFAULT false
created_at          TIMESTAMP    DEFAULT now()
```

---

### `attachments`
> Files (X-rays, photos, documents) stored on Cloudinary.
> Can belong to a patient directly OR to a specific session.

```sql
id           UUID         PRIMARY KEY
patient_id   UUID         NOT NULL  REFERENCES patients(id)
session_id   UUID                   REFERENCES sessions(id)  -- NULL = patient-level file
file_url     TEXT         NOT NULL  -- Cloudinary URL
file_type    VARCHAR(20)            -- 'xray' | 'photo' | 'document' | 'other'
description  TEXT
uploaded_at  TIMESTAMP    DEFAULT now()
```

---

### `tooth_history`
> Immutable audit log. Every time a tooth's status changes, one row is inserted here.
> Never update or delete rows — append only.

```sql
id          UUID         PRIMARY KEY
tooth_id    UUID         NOT NULL  REFERENCES teeth(id)
session_id  UUID         NOT NULL  REFERENCES sessions(id)
old_status  VARCHAR(50)
new_status  VARCHAR(50)  NOT NULL
notes       TEXT
changed_at  TIMESTAMP    DEFAULT now()
```

---

## Relationships

### One-to-Many

```
clinics ──────────< patients         (clinic has many patients)
clinics ──────────< sessions         (clinic has many sessions)
clinics ──────────< appointments     (clinic has many appointments)
clinics ──────────< payments         (clinic has many payments)

patients ─────────< teeth            (patient has exactly 32 teeth, auto-created)
patients ─────────< sessions         (patient has many sessions over time)
patients ─────────< appointments     (patient has many appointments)
patients ─────────< attachments      (patient has files not tied to a session)
patients ─────────< payments         (patient has many payments across sessions)

sessions ─────────< tooth_history    (session records multiple tooth changes)
sessions ─────────< attachments      (session has specific files e.g. post-op xray)
sessions ─────────< payments         (session can have multiple payment installments)

teeth ────────────< tooth_history    (tooth has full change history)
```

### One-to-One (optional)

```
sessions ─────────○ appointments     (appointment links to session AFTER visit is done)
                                     session_id in appointments is NULL until completed
```

---

## Key Business Rules

1. **Auto-create teeth on patient insert**
   When a new patient is created, insert 32 rows into `teeth` (FDI numbers 11–18, 21–28, 31–38, 41–48), all with `status = 'unknown'`. Best handled with a Postgres trigger or a Supabase Edge Function.

2. **Appointment → Session flow**
   - Appointment is created with `status = 'scheduled'` and `session_id = NULL`
   - When the doctor starts the visit, a `session` row is created
   - `appointments.session_id` is updated to point to the new session
   - `appointments.status` becomes `'completed'`

3. **Tooth status change = tooth_history row**
   Every time `teeth.status` is updated, insert a row in `tooth_history` with the old and new status. Use a Postgres trigger on `teeth` UPDATE.

4. **Payments are append-only**
   Never update or delete payment rows. For refunds, insert a new row with a negative `amount`. This creates an immutable financial audit trail.

5. **Balance is always computed**
   Never store `balance`. Always compute:
   ```sql
   SELECT
     s.amount_charged,
     COALESCE(SUM(p.amount), 0)           AS amount_paid,
     s.amount_charged - COALESCE(SUM(p.amount), 0) AS balance
   FROM sessions s
   LEFT JOIN payments p ON p.session_id = s.id
   WHERE s.id = ?
   GROUP BY s.id;
   ```

6. **payment_status sync**
   After every INSERT into `payments`, update `sessions.payment_status`:
   - `balance = 0` → `'paid'`
   - `balance > 0 AND amount_paid > 0` → `'partial'`
   - `amount_paid = 0` → `'pending'`
   Handle this in the service layer (not a trigger) to keep logic clear.

7. **Attachments dual ownership**
   - `session_id = NULL` → file belongs to the patient generally (e.g. initial X-ray)
   - `session_id = <id>` → file tied to a specific visit (e.g. post-treatment photo)

8. **Email reminders**
   A background job checks `appointments` for upcoming visits and sets
   `reminder_24h_sent = true` / `reminder_1h_sent = true` after sending.
   Filter: `status = 'scheduled'` AND `appointment_date > now()`.

---

## Suggested Indexes

```sql
-- High-frequency lookups
CREATE INDEX idx_patients_clinic      ON patients(clinic_id);
CREATE INDEX idx_sessions_patient     ON sessions(patient_id);
CREATE INDEX idx_sessions_clinic      ON sessions(clinic_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date    ON appointments(appointment_date);
CREATE INDEX idx_teeth_patient        ON teeth(patient_id);
CREATE INDEX idx_tooth_history_tooth  ON tooth_history(tooth_id);
CREATE INDEX idx_attachments_patient  ON attachments(patient_id);
CREATE INDEX idx_attachments_session  ON attachments(session_id);

-- Payments (new)
CREATE INDEX idx_payments_session     ON payments(session_id);
CREATE INDEX idx_payments_patient     ON payments(patient_id);
CREATE INDEX idx_payments_clinic      ON payments(clinic_id);
CREATE INDEX idx_payments_date        ON payments(payment_date);

-- For reminder job
CREATE INDEX idx_appointments_reminder
  ON appointments(appointment_date, status)
  WHERE status = 'scheduled';
```

---

## Supabase Row Level Security (RLS) — Pattern

```sql
-- All tables: clinic_id must match the authenticated user's clinic
-- Example for patients:
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_isolation" ON patients
  FOR ALL USING (
    clinic_id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );
-- Apply same pattern to: sessions, appointments, teeth, attachments, tooth_history, payments
```

---

## Auto-create Teeth Trigger (Postgres)

```sql
CREATE OR REPLACE FUNCTION create_teeth_for_patient()
RETURNS TRIGGER AS $$
DECLARE
  fdi_numbers INT[] := ARRAY[
    11,12,13,14,15,16,17,18,
    21,22,23,24,25,26,27,28,
    31,32,33,34,35,36,37,38,
    41,42,43,44,45,46,47,48
  ];
  tooth_num INT;
BEGIN
  FOREACH tooth_num IN ARRAY fdi_numbers LOOP
    INSERT INTO teeth (id, patient_id, tooth_number, status)
    VALUES (gen_random_uuid(), NEW.id, tooth_num, 'unknown');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_patient_insert
  AFTER INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION create_teeth_for_patient();
```

---

## Tooth History Trigger (Postgres)

```sql
CREATE OR REPLACE FUNCTION log_tooth_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO tooth_history (id, tooth_id, session_id, old_status, new_status, changed_at)
    VALUES (gen_random_uuid(), NEW.id, NULL, OLD.status, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tooth_status_update
  AFTER UPDATE ON teeth
  FOR EACH ROW EXECUTE FUNCTION log_tooth_status_change();
```

> ⚠️ `session_id` will be NULL when triggered automatically. If you want to link it to a session, update `tooth_history` manually after the session is created, or pass session_id via app logic instead of using the trigger.

---

## Payments — Service Layer Pattern (Node.js)

```js
// services/payments.js

async function addPayment({ session_id, patient_id, clinic_id, amount, payment_method, notes }) {
  // 1. Insert payment row
  await db.query(`
    INSERT INTO payments (id, session_id, patient_id, clinic_id, amount, payment_method, notes)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
  `, [session_id, patient_id, clinic_id, amount, payment_method, notes]);

  // 2. Recompute payment_status and sync to session
  const { rows } = await db.query(`
    SELECT
      s.amount_charged,
      COALESCE(SUM(p.amount), 0) AS amount_paid
    FROM sessions s
    LEFT JOIN payments p ON p.session_id = s.id
    WHERE s.id = $1
    GROUP BY s.id
  `, [session_id]);

  const { amount_charged, amount_paid } = rows[0];
  const balance = amount_charged - amount_paid;

  const payment_status =
    balance <= 0     ? 'paid'    :
    amount_paid > 0  ? 'partial' : 'pending';

  await db.query(`
    UPDATE sessions SET payment_status = $1 WHERE id = $2
  `, [payment_status, session_id]);
}
```

---

## Finance Queries

### Per-session payment summary
```sql
SELECT
  s.id,
  s.session_date,
  s.amount_charged,
  COALESCE(SUM(p.amount), 0)                        AS amount_paid,
  s.amount_charged - COALESCE(SUM(p.amount), 0)     AS balance,
  s.payment_status
FROM sessions s
LEFT JOIN payments p ON p.session_id = s.id
WHERE s.patient_id = $1
GROUP BY s.id
ORDER BY s.session_date DESC;
```

### Per-patient full payment history
```sql
SELECT
  p.id,
  p.payment_date,
  p.amount,
  p.payment_method,
  p.notes,
  s.session_date,
  s.amount_charged
FROM payments p
JOIN sessions s ON s.id = p.session_id
WHERE p.patient_id = $1
ORDER BY p.payment_date DESC;
```

### Clinic-wide revenue by method
```sql
SELECT
  payment_method,
  SUM(amount) AS total
FROM payments
WHERE clinic_id = $1
  AND payment_date >= $2
  AND payment_date <  $3
GROUP BY payment_method;
```
