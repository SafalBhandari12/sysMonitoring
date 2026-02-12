import cron from "node-cron";
import { getResponse, hitApi } from "../lib/fetch.js";
import prisma from "../utils/prisma.js";

cron.schedule("*/15 * * * *", () => {
  console.log("Running a task every 15 minutes");
  hitApi();
});

cron.schedule("* * * */1 *", async () => {
  console.log("Running a task every day at midnight");
});
