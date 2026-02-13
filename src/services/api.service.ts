import { Prisma } from "../generated/prisma/client.js";
import prisma from "../utils/prisma.js";
import type { apiSchema } from "../schema/api.schema.js";
import { CONFLICT_ERROR } from "../lib/AppError.js";

class ApiService {
  static async RegisterApi(data: apiSchema) {
    const { method, name, url, body, headers, statusCode } = data;
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
    return response;
  }
}

export default ApiService;
