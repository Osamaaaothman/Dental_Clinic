import { query, pool } from '../db/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const ALLOWED_METHODS = ['cash', 'card', 'insurance'];

function parseAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value === 0) {
    throw new ValidationError('amount must be a non-zero number');
  }
  return value;
}

async function syncPaymentStatus(client, session_id) {
  const { rows } = await client.query(`
    SELECT
      s.amount_charged,
      COALESCE(SUM(p.amount), 0) AS amount_paid
    FROM sessions s
    LEFT JOIN payments p ON p.session_id = s.id
    WHERE s.id = $1
    GROUP BY s.id
  `, [session_id]);

  if (!rows[0]) {
    throw new NotFoundError('Session not found');
  }

  const amountCharged = Number(rows[0].amount_charged) || 0;
  const amountPaid = Number(rows[0].amount_paid) || 0;
  const balance = amountCharged - amountPaid;

  const payment_status =
    balance <= 0 ? 'paid' :
    amountPaid > 0 ? 'partial' :
    'pending';

  await client.query(
    'UPDATE sessions SET payment_status = $1 WHERE id = $2',
    [payment_status, session_id]
  );

  return { payment_status, amount_paid: amountPaid, balance };
}

export async function getPaymentsBySession(session_id, clinic_id) {
  if (!session_id || !clinic_id) {
    throw new ValidationError('session_id and clinic_id are required');
  }

  const { rows: sessionCheck } = await query(
    'SELECT id FROM sessions WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [session_id, clinic_id]
  );

  if (!sessionCheck[0]) {
    throw new NotFoundError('Session not found');
  }

  const { rows } = await query(
    `SELECT * FROM payments
     WHERE session_id = $1 AND clinic_id = $2
     ORDER BY payment_date DESC, created_at DESC`,
    [session_id, clinic_id]
  );

  return rows;
}

export async function getPaymentsByPatient(patient_id, clinic_id) {
  if (!patient_id || !clinic_id) {
    throw new ValidationError('patient_id and clinic_id are required');
  }

  const { rows: patientCheck } = await query(
    'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [patient_id, clinic_id]
  );

  if (!patientCheck[0]) {
    throw new NotFoundError('Patient not found');
  }

  const { rows } = await query(
    `SELECT p.*, s.session_date, s.amount_charged
     FROM payments p
     JOIN sessions s ON s.id = p.session_id
     WHERE p.patient_id = $1 AND p.clinic_id = $2
     ORDER BY p.payment_date DESC, p.created_at DESC`,
    [patient_id, clinic_id]
  );

  return rows;
}

export async function addPayment({ session_id, patient_id, clinic_id, amount, payment_method, notes }) {
  if (!session_id || !clinic_id) {
    throw new ValidationError('session_id and clinic_id are required');
  }

  if (!payment_method || !ALLOWED_METHODS.includes(payment_method)) {
    throw new ValidationError(`payment_method must be one of: ${ALLOWED_METHODS.join(', ')}`);
  }

  const parsedAmount = parseAmount(amount);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: sessionRows } = await client.query(
      'SELECT id, patient_id FROM sessions WHERE id = $1 AND clinic_id = $2 LIMIT 1',
      [session_id, clinic_id]
    );

    if (!sessionRows[0]) {
      throw new NotFoundError('Session not found');
    }

    const sessionPatientId = sessionRows[0].patient_id;
    if (patient_id && patient_id !== sessionPatientId) {
      throw new ValidationError('patient_id does not match session');
    }

    const finalPatientId = patient_id || sessionPatientId;

    const { rows: paymentRows } = await client.query(
      `INSERT INTO payments (session_id, patient_id, clinic_id, amount, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [session_id, finalPatientId, clinic_id, parsedAmount, payment_method, notes || null]
    );

    const payment = paymentRows[0];
    const summary = await syncPaymentStatus(client, session_id);

    await client.query('COMMIT');

    return { payment, summary };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function refundPayment(payment_id, clinic_id) {
  if (!payment_id || !clinic_id) {
    throw new ValidationError('payment_id and clinic_id are required');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: paymentRows } = await client.query(
      'SELECT * FROM payments WHERE id = $1 AND clinic_id = $2 LIMIT 1',
      [payment_id, clinic_id]
    );

    if (!paymentRows[0]) {
      throw new NotFoundError('Payment not found');
    }

    const original = paymentRows[0];
    const refundAmount = -Math.abs(Number(original.amount) || 0);

    if (refundAmount === 0) {
      throw new ValidationError('Payment amount is invalid for refund');
    }

    const { rows: refundRows } = await client.query(
      `INSERT INTO payments (session_id, patient_id, clinic_id, amount, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        original.session_id,
        original.patient_id,
        original.clinic_id,
        refundAmount,
        original.payment_method,
        `Refund for payment ${payment_id}`,
      ]
    );

    const refund = refundRows[0];
    const summary = await syncPaymentStatus(client, original.session_id);

    await client.query('COMMIT');

    return { refund, summary };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
