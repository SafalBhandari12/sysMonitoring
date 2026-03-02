import { Router } from "express";
import AuthController from "../controller/auth.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { authenticationMiddleware } from "../middleware/authentication.middleware.js";

const authRouter = Router();

authRouter.get("/google/login", asyncHandler(AuthController.googleLogin));
authRouter.get("/google/callback", asyncHandler(AuthController.googleCallback));
authRouter.get(
  "/profile",
  authenticationMiddleware,
  asyncHandler(AuthController.getProfile),
);
export default authRouter;
