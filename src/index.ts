import "dotenv/config";
import "./cron/index.js";

import express, { type Request, type Response } from "express";
import zod from "zod";
import prisma from "./utils/prisma.js";
import { Prisma } from "./generated/prisma/client.js";
import { getResponse } from "./lib/fetch.js";

const apiSchema = zod.object({
  name: zod.string(),
  url: zod.url(),
  method: zod.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: zod.record(zod.string(), zod.string()).optional(),
  body: zod.record(zod.string(), zod.string()).optional(),
  statusCode: zod.number().optional(),
});

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.get("/schedule", async (req: Request, res: Response) => {
  try {
    getResponse("https://jsonplaceholder.typicode.com/todos/1", "GET");
    res.json({ message: "Scheduled API call" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internala Server Error" });
  }
});

app.post("/register-api", async (req: Request, res: Response) => {
  try {
    const data = apiSchema.safeParse(req.body);
    if (!data.success) {
      return res.status(400).json({ error: data.error });
    }
    const { method, name, url, body, headers, statusCode } = data.data;
    const response = await prisma.api.create({
      data: {
        method,
        name,
        url,
        body: body ?? Prisma.JsonNull,
        headers: headers ?? Prisma.JsonNull,
        statusCode: statusCode ?? null,
      },
      select: {
        id: true,
        method: true,
        name: true,
        url: true,
        body: true,
        headers: true,
        statusCode: true,
      },
    });
    res.json(response);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
