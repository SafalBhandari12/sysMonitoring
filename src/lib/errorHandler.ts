import type { NextFunction, Request, Response } from "express";
import { AppError } from "./error.js";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues.map((e) => e.message).join(", ") });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal Server Error" });
};
