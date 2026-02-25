import cron from "node-cron";
import { hitApi, processApiForUptime } from "../lib/fetch.js";
import DomainService from "../services/domain.service.js";

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("Running a task every 15 minutes");
    await hitApi();
  } catch (error) {
    console.error("Error in hitApi cron job:", error);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running a task every day at midnight");
    await processApiForUptime();
  } catch (error) {
    console.error("Error in processApiForUptime cron job:", error);
  }
});

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("Running a task every 5 minutes to process domains");
    await DomainService.cronJobDomainVerification();
  } catch (error) {
    console.error("Error in domain verification cron job:", error);
  }
});
