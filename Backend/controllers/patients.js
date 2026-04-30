import * as patientService from '../services/patients.js';
import * as teethService from '../services/teeth.js';
import { ValidationError } from '../utils/errors.js';

export async function getPatients(req, res, next) {
  try {
    const { clinic_id, search, page } = req.query;

    const result = await patientService.getPatients({
      clinic_id,
      search: search || '',
      page: page || 1
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPatientById(req, res, next) {
  try {
    const { id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const patient = await patientService.getPatientById(id, clinic_id);
    res.json({ patient });
  } catch (error) {
    next(error);
  }
}

export async function createPatient(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const patient = await patientService.createPatient({
      ...req.body,
      clinic_id
    });

    res.status(201).json({ patient });
  } catch (error) {
    next(error);
  }
}

export async function updatePatient(req, res, next) {
  try {
    const { id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const patient = await patientService.updatePatient(id, clinic_id, req.body);
    res.json({ patient });
  } catch (error) {
    next(error);
  }
}

export async function deletePatient(req, res, next) {
  try {
    const { id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    await patientService.deletePatient(id, clinic_id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getPatientTeeth(req, res, next) {
  try {
    const { id: patient_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const teeth = await teethService.getTeethByPatientId(patient_id, clinic_id);
    res.json({ teeth });
  } catch (error) {
    next(error);
  }
}
