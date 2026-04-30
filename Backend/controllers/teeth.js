import * as teethService from '../services/teeth.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export async function getTeethByPatientId(req, res, next) {
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

export async function updateToothStatus(req, res, next) {
  try {
    const { toothId } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const tooth = await teethService.updateToothStatus(toothId, clinic_id, req.body);
    res.json({ tooth });
  } catch (error) {
    next(error);
  }
}

export async function getToothHistory(req, res, next) {
  try {
    const { toothId } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const history = await teethService.getToothHistory(toothId, clinic_id);
    res.json({ history });
  } catch (error) {
    next(error);
  }
}
