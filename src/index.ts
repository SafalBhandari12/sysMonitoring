import "dotenv/config";
import "./cron/index.js";

import express, { type Request, type Response } from "express";
import { errorHandler } from "./lib/errorHandler.js";
import router from "./routes/index.js";
import redisClient, { connectRedis } from "./utils/redis.js";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { config } from "./utils/config.js";

const app = express();

app.use(express.json());

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    }, // 1 day
  }),
);

app.get("/health", (req: Request, res: Response) => {
  return res.json({ status: "OK" });
});

app.use("/", router);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectRedis();
  console.log(`Server is running on port ${PORT}`);
});
