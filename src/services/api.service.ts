import {
  DomainVerificationStatus,
  Prisma,
} from "../generated/prisma/client.js";
import prisma from "../utils/prisma.js";
import type { apiDetailsSchema } from "../schema/api.schema.js";
import { CONFLICT_ERROR, NotFoundError } from "../lib/AppError.js";
import VerificationService from "./verification.service.js";

class ApiService {
  static async RegisterApi(data: apiDetailsSchema) {
    const { method, name, url, body, headers } = data;

    // Extract base domain (without www and protocol)
    const baseDomain = VerificationService.getBaseDomain(url);

    const existingApi = await prisma.api.findFirst({
      where: {
        url: baseDomain,
      },
    });
    if (existingApi) {
      throw new CONFLICT_ERROR("API with the same URL already exists");
    }
    const response = await prisma.api.create({
      data: {
        method,
        name,
        url: baseDomain,
        body: body ?? Prisma.JsonNull,
        headers: headers ?? Prisma.JsonNull,
      },
      select: {
        id: true,
        method: true,
        name: true,
        url: true,
        verificationCode: true,
        verificationStatus: true,
        body: true,
        headers: true,
      },
    });
    return response;
  }
  static async GetDetails(url: string) {
    const baseDomain = VerificationService.getBaseDomain(url);
    const result = await prisma.$transaction(async (tx) => {
      const apiDetails = await tx.api.findUnique({
        where: { url: baseDomain },
        select: { upTime: true, averageResponseTime: true, id: true },
      });
      if (!apiDetails) {
        throw new NotFoundError("API not found");
      }
      const dailyStats = await tx.dailyStats.findMany({
        where: { apiId: apiDetails?.id },
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
  static async verifyDomain(url: string) {
    const baseDomain = VerificationService.getBaseDomain(url);
    const api = await prisma.api.findFirst({
      where: { url: baseDomain },
    });
    if (!api) {
      throw new NotFoundError("API not found");
    }
    if (api.verificationStatus === DomainVerificationStatus.VERIFIED) {
      throw new CONFLICT_ERROR("Domain already verified");
    }
    const domain = VerificationService.extractDomain(api.url);
    const isVerified = await VerificationService.verifyDomain(
      domain,
      api.verificationCode,
    );
    const updateData = {
      lastVerificationAttempt: new Date(),
      verificationAttempts: api.verificationAttempts + 1,
      verificationStatus: isVerified
        ? DomainVerificationStatus.VERIFIED
        : DomainVerificationStatus.FAILED,
      verifiedAt: isVerified ? new Date() : null,
    };
    const updated = await prisma.api.update({
      where: { url: baseDomain },
      data: {
        ...updateData,
      },
      select: {
        id: true,
        verificationStatus: true,
        verifiedAt: true,
      },
    });
    return updated;
  }
}

export default ApiService;
