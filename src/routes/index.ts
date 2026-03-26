import { Router } from "express";
import domainRouter from "./domain.route.js";
import apiRouter from "./api.route.js";
import authRouter from "./auth.route.js";
import { hitApi, processApiForUptime } from "../lib/fetch.js";

const router = Router();

router.use("/domain", domainRouter);
router.use("/api", apiRouter);
router.use("/auth", authRouter);
router.get("/test", async (req, res) => {
  await hitApi();
  await processApiForUptime();
  res.json({ message: "Welcome to the monitoring API" });
});

export default router;
