import "dotenv/config";
import "./cron/index.js";

import express, { type Request, type Response } from "express";
import { hitApi, processApiForUptime } from "./lib/fetch.js";
import { errorHandler } from "./lib/errorHandler.js";
import { asyncHandler } from "./lib/asyncHandler.js";
import domainRouter from "./routes/domain.route.js";
import apiRouter from "./routes/api.route.js";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  return res.json({ status: "OK" });
});

app.use("/domain", domainRouter);
app.use("/api", apiRouter);

app.get(
  "/schedule",
  asyncHandler(async (req: Request, res: Response) => {
    await hitApi();
    res.json({ message: "Scheduled API call" });
  }),
);

app.get(
  "/uptime",
  asyncHandler(async (req: Request, res: Response) => {
    await processApiForUptime();
    res.json({ message: "Uptime calculated" });
  }),
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
