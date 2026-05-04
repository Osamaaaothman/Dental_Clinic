import multer from 'multer';
import * as attachmentService from '../services/attachments.js';
import { ValidationError } from '../utils/errors.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = /jpeg|jpg|png|pdf|dicom|dcm/i;
    if (allowedMimes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('File type not allowed. Allowed: JPEG, PNG, PDF, DICOM'));
    }
  },
});

export { upload };

export async function getAttachments(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const { patient_id, session_id } = req.query;

    if (!patient_id) {
      throw new ValidationError('patient_id query parameter is required');
    }

    const attachments = await attachmentService.getAttachments(
      patient_id,
      clinic_id,
      session_id || null
    );

    res.json({ attachments });
  } catch (error) {
    next(error);
  }
}

export async function uploadAttachment(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { patient_id, session_id, file_type, description } = req.body;

    const attachment = await attachmentService.createAttachment(
      {
        patient_id,
        clinic_id,
        session_id: session_id || null,
        file_type: file_type || 'other',
        description,
      },
      req.file.buffer
    );

    res.status(201).json({ attachment });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttachment(req, res, next) {
  try {
    const { id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    await attachmentService.deleteAttachment(id, clinic_id);
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    next(error);
  }
}
