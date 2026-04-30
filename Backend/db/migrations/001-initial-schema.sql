CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  gender VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  blood_type VARCHAR(5),
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teeth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number INT NOT NULL,
  status VARCHAR(50) DEFAULT 'unknown',
  color_code VARCHAR(10),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (patient_id, tooth_number)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  session_date DATE NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_done TEXT,
  teeth_treated JSONB,
  medications TEXT,
  next_visit_notes TEXT,
  amount_charged DECIMAL(10, 2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  session_id UUID REFERENCES sessions(id),
  appointment_date TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 30,
  type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'scheduled',
  doctor_notes TEXT,
  reminder_1h_sent BOOLEAN DEFAULT false,
  reminder_24h_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  session_id UUID REFERENCES sessions(id),
  file_url TEXT NOT NULL,
  file_type VARCHAR(20),
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount <> 0),
  payment_method VARCHAR(20) NOT NULL,
  payment_date TIMESTAMP DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tooth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tooth_id UUID NOT NULL REFERENCES teeth(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_at TIMESTAMP DEFAULT now()
);
