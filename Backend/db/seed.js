import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from './index.js';

dotenv.config();

async function seed() {
  const client = await pool.connect();

  const clinic1Name = process.env.CLINIC_1_NAME || 'العيادة الأولى';
  const clinic1Location = process.env.CLINIC_1_LOCATION || 'القاهرة';
  const clinic2Name = process.env.CLINIC_2_NAME || 'العيادة الثانية';
  const clinic2Location = process.env.CLINIC_2_LOCATION || 'الإسكندرية';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe1234!';

  try {
    await client.query('BEGIN');

    await client.query(
      `
      INSERT INTO clinics (name, location)
      VALUES ($1, $2), ($3, $4)
      ON CONFLICT (name) DO NOTHING
      `,
      [clinic1Name, clinic1Location, clinic2Name, clinic2Location]
    );

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await client.query(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (email) DO NOTHING
      `,
      [adminEmail, passwordHash]
    );

    await client.query('COMMIT');
    console.log('تمت إضافة البيانات الأولية بنجاح.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('فشل إدخال البيانات الأولية:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
