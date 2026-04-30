import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientTeeth
} from '../controllers/patients.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id/teeth', getPatientTeeth);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;
