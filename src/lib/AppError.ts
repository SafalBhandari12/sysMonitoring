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

export { BadRequestError, NotFoundError, UnauthorizedError };
