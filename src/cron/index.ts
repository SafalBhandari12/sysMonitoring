import cron from "node-cron";
import { getResponse } from "../lib/fetch.js";

cron.schedule("* * * * *", () => {
  getResponse("https://jsonplaceholder.typicode.com/todos/1", "GET");
  console.log("Running a task every minute");
});
