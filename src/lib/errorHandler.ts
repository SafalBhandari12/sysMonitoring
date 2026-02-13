import type { Request, Response } from "express";
import { AppError } from "./error.js";

export const errorHandler = (err: Error, req: Request, res: Response) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
};
