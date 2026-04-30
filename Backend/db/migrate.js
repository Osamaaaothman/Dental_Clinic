import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      const fullPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(fullPath, 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`تم تطبيق ملف الترحيل: ${file}`);
    }

    console.log('اكتملت جميع الترحيلات بنجاح.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('فشل تنفيذ الترحيلات:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
