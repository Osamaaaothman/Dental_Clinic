import { query } from '../db/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const FDI_NUMBERS = [
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48
];

const ALLOWED_GENDERS = ['male', 'female'];
const PAGE_SIZE = 20;

export async function getPatients({ clinic_id, search = '', page = 1 }) {
  if (!clinic_id) {
    throw new ValidationError('clinic_id is required');
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  let whereClause = 'WHERE clinic_id = $1';
  let params = [clinic_id];

  if (search) {
    whereClause += ' AND full_name ILIKE $2';
    params.push(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) FROM patients ${whereClause}`;
  const { rows: countRows } = await query(countQuery, params);
  const total = parseInt(countRows[0].count);

  const dataQuery = `
    SELECT id, full_name, birth_date, gender, phone, email, blood_type, created_at
    FROM patients
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const { rows } = await query(dataQuery, [...params, PAGE_SIZE, offset]);

  return {
    patients: rows,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / PAGE_SIZE)
  };
}

export async function getPatientById(id, clinic_id) {
  const { rows } = await query(
    'SELECT * FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [id, clinic_id]
  );

  if (!rows[0]) {
    throw new NotFoundError('Patient not found');
  }

  return rows[0];
}

export async function createPatient(data) {
  const {
    clinic_id,
    full_name,
    birth_date,
    gender,
    phone,
    email,
    blood_type,
    allergies,
    notes
  } = data;

  if (!clinic_id || !full_name) {
    throw new ValidationError('clinic_id and full_name are required');
  }

  if (gender && !ALLOWED_GENDERS.includes(gender)) {
    throw new ValidationError('gender must be "male" or "female"');
  }

  const { rows } = await query(`
    INSERT INTO patients (clinic_id, full_name, birth_date, gender, phone, email, blood_type, allergies, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [clinic_id, full_name, birth_date, gender, phone, email, blood_type, allergies, notes]);

  const patient = rows[0];

  await query(`
    INSERT INTO teeth (patient_id, tooth_number, status)
    SELECT $1, tooth_num, 'unknown'
    FROM unnest(ARRAY[${FDI_NUMBERS.join(',')}]) AS tooth_num
    ON CONFLICT (patient_id, tooth_number) DO NOTHING
  `, [patient.id]);

  return patient;
}

export async function updatePatient(id, clinic_id, data) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const fieldMap = {
    full_name: data.full_name,
    birth_date: data.birth_date,
    gender: data.gender,
    phone: data.phone,
    email: data.email,
    blood_type: data.blood_type,
    allergies: data.allergies,
    notes: data.notes
  };

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      if (key === 'gender' && value && !ALLOWED_GENDERS.includes(value)) {
        throw new ValidationError('gender must be "male" or "female"');
      }
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(id, clinic_id);
  const { rows } = await query(`
    UPDATE patients
    SET ${fields.join(', ')}
    WHERE id = $${paramCount} AND clinic_id = $${paramCount + 1}
    RETURNING *
  `, values);

  if (!rows[0]) {
    throw new NotFoundError('Patient not found');
  }

  return rows[0];
}

export async function deletePatient(id, clinic_id) {
  const { rows } = await query(
    'DELETE FROM patients WHERE id = $1 AND clinic_id = $2 RETURNING id',
    [id, clinic_id]
  );

  if (!rows[0]) {
    throw new NotFoundError('Patient not found');
  }

  return { success: true };
}
