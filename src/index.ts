import "dotenv/config";
import "./cron/index.js";

import express, { type Request, type Response } from "express";
import { hitApi, processApiForUptime } from "./lib/fetch.js";
import { asyncHandler } from "./lib/asyncHandler.js";
import ApiController from "./controller/api.controller.js";
import { errorHandler } from "./lib/errorHandler.js";
import ApiService from "./services/api.service.js";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.get("/details", asyncHandler(ApiController.getDetails));

app.get("/schedule", async (req: Request, res: Response) => {
  try {
    hitApi();
    res.json({ message: "Scheduled API call" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/uptime", async (req: Request, res: Response) => {
  try {
    await processApiForUptime();
    res.json({ message: "Uptime calculated" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/register-api", asyncHandler(ApiController.RegisterApi));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
