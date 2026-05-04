import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getPaymentsBySession,
  getPaymentsByPatient,
  addPayment,
  refundPayment,
} from '../controllers/payments.js';

const router = express.Router();

router.use(verifyToken);

router.get('/sessions/:id/payments', getPaymentsBySession);
router.post('/sessions/:id/payments', addPayment);
router.get('/patients/:id/payments', getPaymentsByPatient);
router.delete('/payments/:id', refundPayment);

export default router;
