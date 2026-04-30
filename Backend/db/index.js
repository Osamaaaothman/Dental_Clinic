import dotenv from 'dotenv';
import pg from 'pg';
import { URL } from 'url';

dotenv.config();

const { Pool } = pg;

// Parse DATABASE_URL to extract connection parameters
const parseConnectionString = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    const url = new URL(connectionString);
    
    const config = {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      database: url.pathname.slice(1), // Remove leading slash
      ssl: { rejectUnauthorized: false },
      // Force IPv4 to avoid ENETUNREACH on IPv6-only DNS resolution
      family: 4,
      // Add connection timeout to fail faster if network is unreachable
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 20, // Connection pool size
    };
    
    console.log(`[DB] Connecting to ${config.host}:${config.port}/${config.database} with IPv4 preference`);
    
    return config;
  } catch (error) {
    console.error('[DB] Failed to parse DATABASE_URL:', error.message);
    throw error;
  }
};

export const pool = new Pool(parseConnectionString());

// Log connection events for debugging
pool.on('connect', () => {
  console.log('[DB] ✓ Database connection established (IPv4 preference applied)');
});

pool.on('error', (err) => {
  console.error('[DB] ✗ Unexpected error on idle database client:', err.message);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('[DB] ✗ Initial connection test FAILED:', err.message);
  } else {
    console.log('[DB] ✓ Initial connection test SUCCESS at', result.rows[0].now);
  }
});

export const query = (text, params = []) => pool.query(text, params);
