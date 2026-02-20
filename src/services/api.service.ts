import {
  DomainVerificationStatus,
  Prisma,
} from "../generated/prisma/client.js";
import prisma from "../utils/prisma.js";
import type { apiDetailsSchema } from "../schema/schema.js";
import { CONFLICT_ERROR, NotFoundError } from "../lib/AppError.js";
import { getBaseDomain } from "../utils/domain.js";

class ApiService {
  static async addApi(data: {
    domainId: string;
    apiDetails: apiDetailsSchema;
  }) {
    const { domainId, apiDetails } = data;
    const domainExists = await prisma.domain.findUnique({
      where: { id: domainId },
    });
    if (!domainExists) {
      throw new NotFoundError("Domain not found");
    }
    const pathExists = await prisma.api.findFirst({
      where: {
        path: apiDetails.path,
        domainId,
      },
    });
    if (pathExists) {
      throw new CONFLICT_ERROR("API with the same path already exists");
    }
    const response = await prisma.api.create({
      data: {
        name: apiDetails.name,
        method: apiDetails.method,
        path: apiDetails.path,
        ...(apiDetails.headers && { headers: apiDetails.headers }),
        ...(apiDetails.body && { body: apiDetails.body }),
        domainId,
      },
      select: {
        id: true,
      },
    });
    return response;
  }
}

export default ApiService;
