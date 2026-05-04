import * as paymentService from '../services/payments.js';
import { ValidationError } from '../utils/errors.js';

export async function getPaymentsBySession(req, res, next) {
  try {
    const { id: session_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const payments = await paymentService.getPaymentsBySession(session_id, clinic_id);
    res.json({ payments });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentsByPatient(req, res, next) {
  try {
    const { id: patient_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const payments = await paymentService.getPaymentsByPatient(patient_id, clinic_id);
    res.json({ payments });
  } catch (error) {
    next(error);
  }
}

export async function addPayment(req, res, next) {
  try {
    const { id: session_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const { payment_method, amount, notes, patient_id } = req.body;

    const result = await paymentService.addPayment({
      session_id,
      patient_id,
      clinic_id,
      amount,
      payment_method,
      notes,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function refundPayment(req, res, next) {
  try {
    const { id: payment_id } = req.params;
    const clinic_id = req.user.clinicId;

    if (!clinic_id) {
      throw new ValidationError('No clinic selected');
    }

    const result = await paymentService.refundPayment(payment_id, clinic_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
