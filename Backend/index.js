import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.js';
import clinicsRoutes from './routes/clinics.js';
import sessionsRoutes from './routes/sessions.js';
import attachmentsRoutes from './routes/attachments.js';
import patientsRoutes from './routes/patients.js';
import teethRoutes from './routes/teeth.js';
import { verifyToken } from './middleware/auth.js';
import { pool } from './db/index.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter(Boolean)
);

// Match any Vercel preview URL belonging to your project
const VERCEL_PREVIEW_PATTERN = /^https:\/\/dental-clinic-[a-z0-9-]+-osama1111222-gmailcoms-projects\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (VERCEL_PREVIEW_PATTERN.test(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'الخادم يعمل بشكل طبيعي' });
});

// Debug endpoint to check database connection status
app.get('/api/debug', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    const dbUrl = process.env.DATABASE_URL;
    const masked = dbUrl ? dbUrl.replace(/:[^@]+@/, ':****@') : 'NOT SET';
    
    res.json({
      ok: true,
      databaseConnected: true,
      databaseTime: result.rows[0].now,
      environment: process.env.NODE_ENV,
      databaseUrl: masked,
    });
  } catch (error) {
    const dbUrl = process.env.DATABASE_URL;
    const masked = dbUrl ? dbUrl.replace(/:[^@]+@/, ':****@') : 'NOT SET';
    
    res.status(500).json({
      ok: false,
      databaseConnected: false,
      error: error.message,
      databaseUrl: masked,
      environment: process.env.NODE_ENV,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/clinics', verifyToken, clinicsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/teeth', teethRoutes);

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'حدث خطأ داخلي في الخادم';
  
  // Log error details for Railway debugging
  console.error(`[ERROR] Status ${status}:`, {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });
  
  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
