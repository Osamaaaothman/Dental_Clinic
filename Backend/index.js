import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.js';
import clinicsRoutes from './routes/clinics.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'الخادم يعمل بشكل طبيعي' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clinics', verifyToken, clinicsRoutes);

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'حدث خطأ داخلي في الخادم';
  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
