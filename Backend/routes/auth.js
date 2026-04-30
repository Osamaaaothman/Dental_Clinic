import express from 'express';
import { login, logout, me, selectClinic } from '../controllers/auth.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, me);
router.post('/select-clinic', verifyToken, selectClinic);

export default router;
