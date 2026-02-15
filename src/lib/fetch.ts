import type { methodEnum } from "../generated/prisma/enums.js";
import prisma from "../utils/prisma.js";

export const getResponse = async (
  url: string,
  method: methodEnum,
  headers?: any,
  body?: any,
) => {
  const startTime = Date.now();
  console.log(
    `Making ${method} request to ${url} with headers:`,
    headers,
    "and body:",
    body,
  );
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: headers ? JSON.parse(headers) : undefined,
      body: body ? JSON.stringify(body) : null,
      cache: "no-cache",
    });
  } catch (e) {
    console.error(`Error making request to ${url}:`, e);
    return { statusCode: 500, responseTime: 0 };
  }
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  const statusCode = response.status;
  console.log(statusCode, responseTime);
  return { statusCode, responseTime };
};

export const hitApi = async () => {
  try {
    const urlsToProcess = await prisma.api.findMany({
      where: {
        processingStatus: false,
      },
    });
    for (const urlData of urlsToProcess) {
      const { id, url, method, headers, body } = urlData;
      prisma.$transaction(async (tx) => {
        await tx.api.update({
          where: { id },
          data: { processingStatus: true },
        });
        const response = await getResponse(url, method, headers, body);
        const isUp = response.statusCode >= 200 && response.statusCode < 300;
        await tx.apiResponse.create({
          data: {
            apiId: id,
            responseTime: response.responseTime,
            statusCode: response.statusCode,
            status: isUp ? "UP" : "DOWN",
          },
        });

        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);

        const existing = await tx.dailyStats.findFirst({
          where: {
            apiId: id,
            date: dayStart,
          },
        });

        if (!existing) {
          await tx.dailyStats.create({
            data: {
              apiId: id,
              date: dayStart,
              upCount: isUp ? 1 : 0,
              avgResponseTime: response.responseTime,
              maxResponseTime: response.responseTime,
              totalCount: 1,
              upTime: isUp ? 100 : 0,
            },
          });
        } else {
          const newUpCount = existing.upCount + (isUp ? 1 : 0);
          const newTotalCount = existing.totalCount + 1;
          const newAvgResponseTime =
            (existing.avgResponseTime * existing.totalCount +
              response.responseTime) /
            newTotalCount;
          const newMaxResponseTime = Math.max(
            existing.maxResponseTime,
            response.responseTime,
          );
          await tx.dailyStats.update({
            where: { id: existing.id },
            data: {
              upCount: newUpCount,
              avgResponseTime: newAvgResponseTime,
              maxResponseTime: newMaxResponseTime,
              totalCount: newTotalCount,
              upTime: (newUpCount / newTotalCount) * 100,
            },
          });
        }

        await tx.api.update({
          where: { id },
          data: { processingStatus: false },
        });
      });
      try {
      } catch (e) {
        console.error(`Error processing URL with id ${id}:`, e);
      }
    }
  } catch (e) {
    console.error(e);
  }
};

export const processApiForUptime = async () => {
  const apis = await prisma.api.findMany({ select: { id: true } });
  for (const api of apis) {
    await calculateUptime(api.id);
  }
};

export const calculateUptime = async (apiId: string) => {
  try {
    const stats = await prisma.dailyStats.findMany({
      where: {
        apiId,
        date: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    });
    let uptime = 0;
    let total = 0;
    let totalResponseTime = 0;
    for (const stat of stats) {
      uptime += stat.upCount;
      total += stat.totalCount;
      totalResponseTime += stat.avgResponseTime * stat.totalCount;
    }

    const uptimePercentage = total > 0 ? (uptime / total) * 100 : 0;
    const averageResponseTime = total > 0 ? totalResponseTime / total : 0;
    await prisma.api.update({
      where: { id: apiId },
      data: { upTime: uptimePercentage, averageResponseTime },
    });
    console.log(
      `Uptime percentage over last 90 days: ${uptimePercentage.toFixed(2)}%`,
    );
  } catch (e) {
    console.error(e);
  }
};
