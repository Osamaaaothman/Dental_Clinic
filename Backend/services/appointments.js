import { query } from '../db/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const PAGE_SIZE = 20;
const ALLOWED_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];
const ALLOWED_TYPES = [
  'checkup',
  'followup',
  'extraction',
  'cleaning',
  'filling',
  'root_canal',
  'crown',
  'implant',
  'other',
];

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function getAppointments(clinic_id, filters = {}) {
  if (!clinic_id) {
    throw new ValidationError('clinic_id is required');
  }

  const { date_from, date_to, status, page = 1 } = filters;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const where = ['a.clinic_id = $1'];
  const params = [clinic_id];

  const fromDate = normalizeDate(date_from);
  const toDate = normalizeDate(date_to);

  if (fromDate) {
    params.push(fromDate);
    where.push(`a.appointment_date >= $${params.length}`);
  }

  if (toDate) {
    params.push(toDate);
    where.push(`a.appointment_date < $${params.length}`);
  }

  if (status) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }
    params.push(status);
    where.push(`a.status = $${params.length}`);
  } else {
    where.push(`a.status <> 'cancelled'`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM appointments a ${whereClause}`;
  const { rows: countRows } = await query(countQuery, params);
  const total = parseInt(countRows[0]?.count || '0', 10);

  const dataQuery = `
    SELECT a.*, p.full_name, p.email, p.phone
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    ${whereClause}
    ORDER BY a.appointment_date ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const { rows } = await query(dataQuery, [...params, PAGE_SIZE, offset]);

  return {
    appointments: rows,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function createAppointment(data) {
  const {
    patient_id,
    clinic_id,
    appointment_date,
    duration_minutes = 30,
    type = 'other',
    status = 'scheduled',
    doctor_notes,
  } = data;

  if (!patient_id || !clinic_id || !appointment_date) {
    throw new ValidationError('patient_id, clinic_id, and appointment_date are required');
  }

  const parsedDate = normalizeDate(appointment_date);
  if (!parsedDate) {
    throw new ValidationError('appointment_date is invalid');
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  if (type && !ALLOWED_TYPES.includes(type)) {
    throw new ValidationError(`type must be one of: ${ALLOWED_TYPES.join(', ')}`);
  }

  if (duration_minutes !== undefined && Number.isNaN(Number(duration_minutes))) {
    throw new ValidationError('duration_minutes must be a number');
  }

  const { rows: patientCheck } = await query(
    'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [patient_id, clinic_id]
  );

  if (!patientCheck[0]) {
    throw new NotFoundError('Patient not found');
  }

  const { rows } = await query(`
    INSERT INTO appointments (
      patient_id, clinic_id, appointment_date, duration_minutes, type, status, doctor_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    patient_id,
    clinic_id,
    parsedDate,
    Number(duration_minutes || 30),
    type,
    status,
    doctor_notes || null,
  ]);

  return rows[0];
}

export async function getAppointmentById(id, clinic_id) {
  if (!id || !clinic_id) {
    throw new ValidationError('appointment_id and clinic_id are required');
  }

  const { rows } = await query(`
    SELECT a.*, p.full_name, p.email, p.phone
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.id = $1 AND a.clinic_id = $2
    LIMIT 1
  `, [id, clinic_id]);

  if (!rows[0]) {
    throw new NotFoundError('Appointment not found');
  }

  return rows[0];
}

export async function updateAppointment(id, clinic_id, updates) {
  if (!id || !clinic_id) {
    throw new ValidationError('appointment_id and clinic_id are required');
  }

  const fields = [];
  const values = [];
  let paramCount = 1;

  const fieldMap = {
    appointment_date: updates.appointment_date,
    duration_minutes: updates.duration_minutes,
    type: updates.type,
    status: updates.status,
    doctor_notes: updates.doctor_notes,
    session_id: updates.session_id,
  };

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      if (key === 'appointment_date' && value) {
        const parsed = normalizeDate(value);
        if (!parsed) {
          throw new ValidationError('appointment_date is invalid');
        }
        fields.push(`${key} = $${paramCount}`);
        values.push(parsed);
        paramCount += 1;
        continue;
      }
      if (key === 'duration_minutes') {
        fields.push(`${key} = $${paramCount}`);
        values.push(Number(value || 30));
        paramCount += 1;
        continue;
      }
      if (key === 'status' && value && !ALLOWED_STATUSES.includes(value)) {
        throw new ValidationError(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
      }
      if (key === 'type' && value && !ALLOWED_TYPES.includes(value)) {
        throw new ValidationError(`type must be one of: ${ALLOWED_TYPES.join(', ')}`);
      }
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    }
  }

  if (!fields.length) {
    throw new ValidationError('No fields to update');
  }

  values.push(id, clinic_id);

  const { rows } = await query(`
    UPDATE appointments
    SET ${fields.join(', ')}
    WHERE id = $${paramCount} AND clinic_id = $${paramCount + 1}
    RETURNING *
  `, values);

  if (!rows[0]) {
    throw new NotFoundError('Appointment not found');
  }

  return rows[0];
}

export async function deleteAppointment(id, clinic_id) {
  if (!id || !clinic_id) {
    throw new ValidationError('appointment_id and clinic_id are required');
  }

  const { rows } = await query(`
    UPDATE appointments
    SET status = 'cancelled'
    WHERE id = $1 AND clinic_id = $2
    RETURNING id
  `, [id, clinic_id]);

  if (!rows[0]) {
    throw new NotFoundError('Appointment not found');
  }

  return { success: true };
}

export async function getAppointmentsByDate(patient_id, clinic_id, dateValue) {
  if (!patient_id || !clinic_id || !dateValue) {
    throw new ValidationError('patient_id, clinic_id, and date are required');
  }

  const date = normalizeDate(dateValue);
  if (!date) {
    throw new ValidationError('Invalid date value');
  }

  const { rows } = await query(`
    SELECT * FROM appointments
    WHERE patient_id = $1
      AND clinic_id = $2
      AND DATE(appointment_date) = DATE($3)
      AND status = 'scheduled'
    ORDER BY appointment_date ASC
  `, [patient_id, clinic_id, date]);

  return rows;
}
