import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';

export function verifyToken(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('رأس التفويض مفقود أو غير صالح');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (_error) {
    next(new UnauthorizedError('رمز الدخول غير صالح أو منتهي الصلاحية'));
  }
}
