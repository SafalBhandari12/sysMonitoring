import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import DomainController from "../controller/domain.controller.js";
import { processApiForUptime } from "../lib/fetch.js";

const router = Router();

router.post("/register-domain", asyncHandler(DomainController.registerDomain));

router.post("/verify-domain", asyncHandler(DomainController.verifyDomain));

router.get(
  "/verification-status",
  asyncHandler(DomainController.GetVerificationStatus),
);

router.get("/details", asyncHandler(DomainController.apiStatusDetails));

router.get(
  "/calculateUptime",
  asyncHandler(async (req: Request, res: Response) => {
    processApiForUptime();
    return res.json({ message: "Uptime calculated successfully" });
  }),
);

export default router;
