import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import DomainController from "../controller/domain.controller.js";

const router = Router();

router.post("/register-domain", asyncHandler(DomainController.registerDomain));

router.post("/verify-domain", asyncHandler(DomainController.verifyDomain));

router.get(
  "/verification-status",
  asyncHandler(DomainController.GetVerificationStatus),
);

export default router;
