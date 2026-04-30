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
    
    return {
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
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    throw error;
  }
};

export const pool = new Pool(parseConnectionString());

// Log connection events for debugging
pool.on('connect', () => {
  console.log('✓ Database connection established (IPv4 preference applied)');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

export const query = (text, params = []) => pool.query(text, params);
