export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'غير مصرح') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'غير موجود') {
    super(message, 404);
  }
}
