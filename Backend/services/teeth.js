import { query } from '../db/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const ALLOWED_STATUSES = [
  'unknown', 'healthy', 'cavity', 'treated',
  'crown', 'implant', 'root_canal', 'missing'
];

const COLOR_MAP = {
  unknown: '#9ca3af',
  healthy: '#22c55e',
  cavity: '#ef4444',
  treated: '#f97316',
  crown: '#8b5cf6',
  root_canal: '#3b82f6',
  missing: '#4b5563',
  implant: '#eab308'
};

export async function getTeethByPatientId(patient_id, clinic_id) {
  const { rows: patientCheck } = await query(
    'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [patient_id, clinic_id]
  );

  if (!patientCheck[0]) {
    throw new NotFoundError('Patient not found');
  }

  const { rows } = await query(
    'SELECT * FROM teeth WHERE patient_id = $1 ORDER BY tooth_number',
    [patient_id]
  );

  return rows;
}

export async function updateToothStatus(toothId, clinic_id, data) {
  const { status, notes, session_id } = data;

  if (!status) {
    throw new ValidationError('status is required');
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  const { rows: toothCheck } = await query(`
    SELECT t.* FROM teeth t
    JOIN patients p ON p.id = t.patient_id
    WHERE t.id = $1 AND p.clinic_id = $2
    LIMIT 1
  `, [toothId, clinic_id]);

  if (!toothCheck[0]) {
    throw new NotFoundError('Tooth not found');
  }

  const oldStatus = toothCheck[0].status;

  await query(`
    UPDATE teeth
    SET status = $1, notes = $2, updated_at = now()
    WHERE id = $3
  `, [status, notes || toothCheck[0].notes, toothId]);

  if (oldStatus !== status) {
    await query(`
      INSERT INTO tooth_history (tooth_id, session_id, old_status, new_status, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [toothId, session_id || null, oldStatus, status, notes || null]);
  }

  const { rows } = await query('SELECT * FROM teeth WHERE id = $1', [toothId]);
  return rows[0];
}

export async function getToothHistory(toothId, clinic_id) {
  const { rows: toothCheck } = await query(`
    SELECT t.id FROM teeth t
    JOIN patients p ON p.id = t.patient_id
    WHERE t.id = $1 AND p.clinic_id = $2
    LIMIT 1
  `, [toothId, clinic_id]);

  if (!toothCheck[0]) {
    throw new NotFoundError('Tooth not found');
  }

  const { rows } = await query(`
    SELECT * FROM tooth_history
    WHERE tooth_id = $1
    ORDER BY changed_at DESC
  `, [toothId]);

  return rows;
}

export function getColorForStatus(status) {
  return COLOR_MAP[status] || COLOR_MAP.unknown;
}
