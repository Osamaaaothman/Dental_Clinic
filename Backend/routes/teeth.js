import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  updateToothStatus,
  getToothHistory
} from '../controllers/teeth.js';

const router = express.Router();

router.use(verifyToken);

router.put('/:toothId', updateToothStatus);
router.get('/:toothId/history', getToothHistory);

export default router;
