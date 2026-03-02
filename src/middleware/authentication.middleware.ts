import type { Response, Request, NextFunction } from "express";

export async function authenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.session || !req.session.sessionId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
