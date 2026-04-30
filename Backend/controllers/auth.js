import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findClinicById,
  findUserByEmail,
  findUserById,
  getClinics,
} from '../services/auth.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors.js';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  });
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('بيانات تسجيل الدخول غير صحيحة');
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      throw new UnauthorizedError('بيانات تسجيل الدخول غير صحيحة');
    }

    const token = signToken({ userId: user.id, email: user.email, clinicId: null });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      throw new UnauthorizedError('المستخدم غير موجود');
    }

    const clinics = await getClinics();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        selectedClinicId: req.user.clinicId || null,
      },
      clinics,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req, res) {
  res.json({ message: 'تم تسجيل الخروج بنجاح' });
}

export async function selectClinic(req, res, next) {
  try {
    const { clinicId } = req.body;

    if (!clinicId) {
      throw new ValidationError('معرف العيادة مطلوب');
    }

    const clinic = await findClinicById(clinicId);
    if (!clinic) {
      throw new NotFoundError('العيادة غير موجودة');
    }

    const token = signToken({
      userId: req.user.userId,
      email: req.user.email,
      clinicId: clinic.id,
    });

    res.json({
      token,
      selectedClinic: clinic,
    });
  } catch (error) {
    next(error);
  }
}
