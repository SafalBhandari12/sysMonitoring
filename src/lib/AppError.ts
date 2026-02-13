import { statusCode } from "../constants/statusCode.js";
import { AppError } from "./error.js";

class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, statusCode.BAD_REQUEST);
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, statusCode.NOT_FOUND);
  }
}
class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, statusCode.UNAUTHORIZED);
  }
}
class UNPROCESSABLE_ENTITY extends AppError {
  constructor(message: string) {
    super(message, statusCode.UNPROCESSABLE_ENTITY);
  }
}

class CONFLICT_ERROR extends AppError {
  constructor(message: string) {
    super(message, statusCode.CONFLICT);
  }
}

export {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UNPROCESSABLE_ENTITY,
  CONFLICT_ERROR,
};
