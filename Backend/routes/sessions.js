import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/sessions.js';

const router = express.Router();

router.use(verifyToken);

router.get('/patients/:id/sessions', getSessions);
router.post('/patients/:id/sessions', createSession);
router.get('/:id', getSessionById);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
