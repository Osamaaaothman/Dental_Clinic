import * as appointmentService from '../services/appointments.js';
import { ValidationError } from '../utils/errors.js';

export async function listAppointments(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const { clinic_id: clinicQueryId, date_from, date_to, status, page } = req.query;

    if (clinicQueryId && clinicQueryId !== clinic_id) {
      throw new ValidationError('clinic_id does not match selected clinic');
    }

    const result = await appointmentService.getAppointments(clinic_id, {
      date_from,
      date_to,
      status,
      page,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAppointment(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const { clinic_id: clinicQueryId } = req.body || {};
    if (clinicQueryId && clinicQueryId !== clinic_id) {
      throw new ValidationError('clinic_id does not match selected clinic');
    }

    const appointment = await appointmentService.createAppointment({
      ...req.body,
      clinic_id,
    });

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
}

export async function getAppointment(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;
    const { id } = req.params;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const appointment = await appointmentService.getAppointmentById(id, clinic_id);
    res.json({ appointment });
  } catch (error) {
    next(error);
  }
}

export async function updateAppointment(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;
    const { id } = req.params;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const { clinic_id: clinicQueryId } = req.body || {};
    if (clinicQueryId && clinicQueryId !== clinic_id) {
      throw new ValidationError('clinic_id does not match selected clinic');
    }

    const appointment = await appointmentService.updateAppointment(id, clinic_id, req.body);
    res.json({ appointment });
  } catch (error) {
    next(error);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const clinic_id = req.user.clinicId;
    const { id } = req.params;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    await appointmentService.deleteAppointment(id, clinic_id);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    next(error);
  }
}
