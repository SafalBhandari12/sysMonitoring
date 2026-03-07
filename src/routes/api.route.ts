import { Router } from "express";
import ApiController from "../controller/api.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { authenticationMiddleware } from "../middleware/authentication.middleware.js";

const router = Router();

router.use(authenticationMiddleware);

router.post("/add/:domainId", asyncHandler(ApiController.addApi));

export default router;
