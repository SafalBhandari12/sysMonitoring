import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "./AppError.js";

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export default notFound;
