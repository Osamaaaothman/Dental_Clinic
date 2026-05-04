import { query } from '../db/index.js';
import { uploadFile, deleteFile } from './cloudinary.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const ALLOWED_FILE_TYPES = ['xray', 'photo', 'document', 'other'];

export async function getAttachments(patient_id, clinic_id, session_id = null) {
  if (!patient_id || !clinic_id) {
    throw new ValidationError('patient_id and clinic_id are required');
  }

  const { rows: patientCheck } = await query(
    'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [patient_id, clinic_id]
  );

  if (!patientCheck[0]) {
    throw new NotFoundError('Patient not found');
  }

  let queryText = 'SELECT * FROM attachments WHERE patient_id = $1';
  const params = [patient_id];

  if (session_id) {
    queryText += ' AND session_id = $2';
    params.push(session_id);
  } else {
    queryText += ' AND session_id IS NULL';
  }

  queryText += ' ORDER BY uploaded_at DESC';

  const { rows } = await query(queryText, params);
  return rows;
}

export async function createAttachment(data, fileBuffer) {
  const { patient_id, clinic_id, session_id, file_type = 'other', description } = data;

  if (!patient_id || !clinic_id) {
    throw new ValidationError('patient_id and clinic_id are required');
  }

  if (!fileBuffer) {
    throw new ValidationError('File is required');
  }

  if (!ALLOWED_FILE_TYPES.includes(file_type)) {
    throw new ValidationError(`file_type must be one of: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  const { rows: patientCheck } = await query(
    'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2 LIMIT 1',
    [patient_id, clinic_id]
  );

  if (!patientCheck[0]) {
    throw new NotFoundError('Patient not found');
  }

  if (session_id) {
    const { rows: sessionCheck } = await query(
      'SELECT id FROM sessions WHERE id = $1 AND clinic_id = $2 LIMIT 1',
      [session_id, clinic_id]
    );

    if (!sessionCheck[0]) {
      throw new NotFoundError('Session not found');
    }
  }

  const uploadResult = await uploadFile(fileBuffer, {
    folder: 'dental-clinic/attachments',
  });

  const { rows } = await query(`
    INSERT INTO attachments (patient_id, session_id, file_url, file_type, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [patient_id, session_id || null, uploadResult.url, file_type, description || null]);

  return rows[0];
}

export async function deleteAttachment(attachment_id, clinic_id) {
  if (!attachment_id || !clinic_id) {
    throw new ValidationError('attachment_id and clinic_id are required');
  }

  const { rows } = await query(`
    SELECT a.* FROM attachments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.id = $1 AND p.clinic_id = $2
    LIMIT 1
  `, [attachment_id, clinic_id]);

  if (!rows[0]) {
    throw new NotFoundError('Attachment not found');
  }

  const attachment = rows[0];

  await query('DELETE FROM attachments WHERE id = $1', [attachment_id]);

  return { success: true };
}
