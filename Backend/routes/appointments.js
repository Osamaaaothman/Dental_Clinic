import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointments.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', listAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
