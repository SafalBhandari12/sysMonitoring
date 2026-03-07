import { Router, type Request, type Response } from "express";
import ApiController from "../controller/api.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { hitApi } from "../lib/fetch.js";
import { authenticationMiddleware } from "../middleware/authentication.middleware.js";

const router = Router();

router.use(authenticationMiddleware);

router.post("/add/:domainId", asyncHandler(ApiController.addApi));

// yo chai prod ma hataunu parxa
router.get(
  "/hit",
  asyncHandler(async (req: Request, res: Response) => {
    await hitApi();
    return res.json({ message: "API hit successfully" });
  }),
);

export default router;
