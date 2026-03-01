import { createClient } from "redis";
import { config } from "./config.js";

const redisClient = createClient({
  url: config.redisUrl,
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    throw error;
  }
};

redisClient.on("error", (msg) => {
  console.log("Redis error:", msg);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

export default redisClient;
