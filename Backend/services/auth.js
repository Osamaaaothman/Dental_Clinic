import { query } from '../db/index.js';

export async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT id, email, password_hash FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query('SELECT id, email, created_at FROM users WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function getClinics() {
  const { rows } = await query('SELECT id, name, location FROM clinics ORDER BY created_at ASC');
  return rows;
}

export async function findClinicById(clinicId) {
  const { rows } = await query('SELECT id, name, location FROM clinics WHERE id = $1 LIMIT 1', [clinicId]);
  return rows[0] || null;
}
