import { query, pool } from '../db/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const ALLOWED_STATUSES = [
  'unknown', 'healthy', 'cavity', 'treated',
  'crown', 'implant', 'root_canal', 'missing'
];

const ALLOWED_PAYMENT_STATUSES = ['paid', 'partial', 'pending'];

const FDI_NUMBERS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48
]);

const PAGE_SIZE = 20;

export async function getSessions(patient_id, clinic_id, { page = 1 } = {}) {
  if (!patient_id || !clinic_id) {
    throw new ValidationError('patient_id and clinic_id are required');
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const { rows: patientCheck } = await query(
    'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [patient_id, clinic_id]
  );

  if (!patientCheck[0]) {
    throw new NotFoundError('Patient not found');
  }

  const countQuery = 'SELECT COUNT(*) FROM sessions WHERE patient_id = $1 AND clinic_id = $2';
  const { rows: countRows } = await query(countQuery, [patient_id, clinic_id]);
  const total = parseInt(countRows[0].count);

  const dataQuery = `
    SELECT s.*,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE session_id = s.id) as amount_paid
    FROM sessions s
    WHERE s.patient_id = $1 AND s.clinic_id = $2
    ORDER BY s.session_date DESC, s.created_at DESC
    LIMIT $3 OFFSET $4
  `;
  const { rows } = await query(dataQuery, [patient_id, clinic_id, PAGE_SIZE, offset]);

  return {
    sessions: rows,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / PAGE_SIZE)
  };
}

export async function getSessionById(session_id, clinic_id) {
  if (!session_id || !clinic_id) {
    throw new ValidationError('session_id and clinic_id are required');
  }

  const { rows } = await query(`
    SELECT s.*,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE session_id = s.id) as amount_paid,
      (SELECT json_agg(json_build_object('id', t.id, 'tooth_number', t.tooth_number, 'status', t.status)
       FROM teeth t
       WHERE t.patient_id = s.patient_id AND t.tooth_number = ANY(ARRAY(SELECT jsonb_array_elements_text(s.teeth_treated)::int))
      ) as treated_teeth_details
    FROM sessions s
    WHERE s.id = $1 AND s.clinic_id = $2
    LIMIT 1
  `, [session_id, clinic_id]);

  if (!rows[0]) {
    throw new NotFoundError('Session not found');
  }

  return rows[0];
}

export async function createSession(data) {
  const {
    patient_id,
    clinic_id,
    session_date,
    chief_complaint,
    diagnosis,
    treatment_done,
    teeth_treated = [],
    medications,
    next_visit_notes,
    amount_charged = 0,
    payment_status = 'pending',
  } = data;

  if (!patient_id || !clinic_id || !session_date) {
    throw new ValidationError('patient_id, clinic_id, and session_date are required');
  }

  const { rows: patientCheck } = await query(
    'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [patient_id, clinic_id]
  );

  if (!patientCheck[0]) {
    throw new NotFoundError('Patient not found');
  }

  if (!Array.isArray(teeth_treated)) {
    throw new ValidationError('teeth_treated must be an array');
  }

  const validTeeth = teeth_treated.filter(t => FDI_NUMBERS.has(Number(t)));
  const teethJsonb = JSON.stringify(validTeeth);

  if (payment_status && !ALLOWED_PAYMENT_STATUSES.includes(payment_status)) {
    throw new ValidationError(`payment_status must be one of: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`
      INSERT INTO sessions (
        patient_id, clinic_id, session_date, chief_complaint, diagnosis,
        treatment_done, teeth_treated, medications, next_visit_notes,
        amount_charged, payment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      patient_id, clinic_id, session_date, chief_complaint, diagnosis,
      treatment_done, teethJsonb, medications, next_visit_notes,
      amount_charged, payment_status
    ]);

    const session = rows[0];

    await client.query('COMMIT');

    return session;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSession(session_id, clinic_id, data) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const fieldMap = {
    session_date: data.session_date,
    chief_complaint: data.chief_complaint,
    diagnosis: data.diagnosis,
    treatment_done: data.treatment_done,
    teeth_treated: data.teeth_treated,
    medications: data.medications,
    next_visit_notes: data.next_visit_notes,
    amount_charged: data.amount_charged,
    payment_status: data.payment_status,
  };

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      if (key === 'teeth_treated') {
        if (!Array.isArray(value)) {
          throw new ValidationError('teeth_treated must be an array');
        }
        const validTeeth = value.filter(t => FDI_NUMBERS.has(Number(t)));
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(validTeeth));
      } else if (key === 'payment_status') {
        if (!ALLOWED_PAYMENT_STATUSES.includes(value)) {
          throw new ValidationError(`payment_status must be one of: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`);
        }
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      } else {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }
  }

  if (fields.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(session_id, clinic_id);
  const { rows } = await query(`
    UPDATE sessions
    SET ${fields.join(', ')}
    WHERE id = $${paramCount} AND clinic_id = $${paramCount + 1}
    RETURNING *
  `, values);

  if (!rows[0]) {
    throw new NotFoundError('Session not found');
  }

  return rows[0];
}

export async function deleteSession(session_id, clinic_id) {
  const { rows } = await query(
    'DELETE FROM sessions WHERE id = $1 AND clinic_id = $2 RETURNING id',
    [session_id, clinic_id]
  );

  if (!rows[0]) {
    throw new NotFoundError('Session not found');
  }

  return { success: true };
}
