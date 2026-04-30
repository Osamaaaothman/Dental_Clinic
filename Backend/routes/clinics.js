import express from 'express';
import { getClinics } from '../services/auth.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const clinics = await getClinics();
    res.json({ clinics });
  } catch (error) {
    next(error);
  }
});

export default router;
