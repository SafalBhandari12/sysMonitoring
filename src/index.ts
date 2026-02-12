import "dotenv/config";
import "./cron/index.js";

import express, { type Request, type Response } from "express";
import { getResponse } from "./lib/fetch.js";
import { asyncHandler } from "./lib/asyncHandler.js";
import ApiController from "./controller/api.controller.js";
import { errorHandler } from "./lib/errorHandler.js";
import { processUrls } from "./cron/index.js";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.get("/schedule", async (req: Request, res: Response) => {
  try {
    processUrls();
    res.json({ message: "Scheduled API call" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/register-api", asyncHandler(ApiController.RegisterApi));

app.get("/stats", asyncHandler(ApiController.GetStatus));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
