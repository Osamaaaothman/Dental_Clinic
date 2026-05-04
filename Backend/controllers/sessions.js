import * as sessionService from '../services/sessions.js';
import { ValidationError } from '../utils/errors.js';

export async function getSessions(req, res, next) {
  try {
    const { id: patient_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const { page } = req.query;

    const result = await sessionService.getSessions(patient_id, clinic_id, { page });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSessionById(req, res, next) {
  try {
    const { id: session_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const session = await sessionService.getSessionById(session_id, clinic_id);
    res.json({ session });
  } catch (error) {
    next(error);
  }
}

export async function createSession(req, res, next) {
  try {
    const { id: patient_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const session = await sessionService.createSession({
      ...req.body,
      patient_id,
      clinic_id,
    });

    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
}

export async function updateSession(req, res, next) {
  try {
    const { id: session_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const session = await sessionService.updateSession(session_id, clinic_id, req.body);
    res.json({ session });
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const { id: session_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    await sessionService.deleteSession(session_id, clinic_id);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
}
