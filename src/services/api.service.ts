import {
  DomainVerificationStatus,
  Prisma,
} from "../generated/prisma/client.js";
import prisma from "../utils/prisma.js";
import type { apiDetailsSchema } from "../schema/schema.js";
import { CONFLICT_ERROR, NotFoundError } from "../lib/AppError.js";
import { getBaseDomain } from "../utils/domain.js";

class ApiService {
  // static async GetDetails(url: string) {
  //   const baseDomain = VerificationService.getBaseDomain(url);
  //   const result = await prisma.$transaction(async (tx) => {
  //     const apiDetails = await tx.api.findUnique({
  //       where: { url: baseDomain },
  //       select: { upTime: true, averageResponseTime: true, id: true },
  //     });
  //     if (!apiDetails) {
  //       throw new NotFoundError("API not found");
  //     }
  //     const dailyStats = await tx.dailyStats.findMany({
  //       where: { apiId: apiDetails?.id },
  //       orderBy: { date: "desc" },
  //       take: 90,
  //       select: {
  //         upTime: true,
  //         date: true,
  //       },
  //     });
  //     return {
  //       upTime: apiDetails!.upTime,
  //       averageResponseTime: apiDetails!.averageResponseTime,
  //       dailyStats,
  //     };
  //   });
  //   return result;
  // }
}

export default ApiService;
