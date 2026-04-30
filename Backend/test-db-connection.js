import { pool } from './db/index.js';

console.log('Testing database connection with IPv4 preference...');

try {
  const result = await pool.query('SELECT NOW()');
  console.log('✓ Database query successful!');
  console.log('Current database time:', result.rows[0]);
  process.exit(0);
} catch (error) {
  console.error('✗ Database connection failed:', error.message);
  process.exit(1);
}
