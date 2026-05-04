import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAttachments,
  uploadAttachment,
  deleteAttachment,
  upload,
} from '../controllers/attachments.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAttachments);
router.post('/', upload.single('file'), uploadAttachment);
router.delete('/:id', deleteAttachment);

export default router;
