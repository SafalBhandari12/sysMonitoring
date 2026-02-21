import cron from "node-cron";
import { hitApi, processApiForUptime } from "../lib/fetch.js";
import DomainService from "../services/domain.service.js";

cron.schedule("*/5 * * * *", async () => {
  console.log("Running a task every 15 minutes");
  await hitApi();
});

cron.schedule("0 0 * * *", async () => {
  console.log("Running a task every day at midnight");
  await processApiForUptime();
});

cron.schedule("*/5 * * * *", async () => {
  console.log("Running a task every 5 minutes to process domains");
  await DomainService.cronJobDomainVerification();
});
