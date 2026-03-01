import { Router } from "express";
import AuthController from "../controller/auth.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const authRouter = Router();

authRouter.get("/google/login", asyncHandler(AuthController.googleLogin));

export default authRouter;
