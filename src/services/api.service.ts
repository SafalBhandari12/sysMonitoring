import { Prisma } from "../generated/prisma/client.js";
import prisma from "../utils/prisma.js";
import type { apiSchema } from "../schema/api.schema.js";
import { CONFLICT_ERROR } from "../lib/AppError.js";

class ApiService {
  static async RegisterApi(data: apiSchema) {
    const { method, name, url, body, headers } = data;
    const existingApi = await prisma.api.findFirst({
      where: {
        url,
      },
    });
    if (existingApi) {
      throw new CONFLICT_ERROR("API with the same URL already exists");
    }
    const response = await prisma.api.create({
      data: {
        method,
        name,
        url,
        body: body ?? Prisma.JsonNull,
        headers: headers ?? Prisma.JsonNull,
      },
      select: {
        id: true,
        method: true,
        name: true,
        url: true,
        body: true,
        headers: true,
      },
    });
    return response;
  }
  static async GetDetails(url: string) {
    const result = await prisma.$transaction(async (tx) => {
      const apiDetails = await tx.api.findUnique({
        where: { url: url },
        select: { upTime: true, averageResponseTime: true, id: true },
      });
      const dailyStats = await tx.dailyStats.findMany({
        where: { apiId: apiDetails!.id },
        orderBy: { date: "desc" },
        take: 90,
        select: {
          upTime: true,
          date: true,
        },
      });
      return {
        upTime: apiDetails!.upTime,
        averageResponseTime: apiDetails!.averageResponseTime,
        dailyStats,
      };
    });
    return result;
  }
}

export default ApiService;
