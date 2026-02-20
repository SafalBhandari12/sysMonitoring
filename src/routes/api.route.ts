import { Router } from "express";
import ApiController from "../controller/api.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { hitApi } from "../lib/fetch.js";

const router = Router();

router.post("/add/:domainId", asyncHandler(ApiController.addApi));

router.get("/hit", asyncHandler(hitApi));

export default router;
