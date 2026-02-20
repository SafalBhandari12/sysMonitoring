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
    // Fetch up to 100 APIs with their domain information
    const apisToProcess = await prisma.api.findMany({
      where: {
        processingStatus: false,
        domain: {
          verificationStatus: {
            equals: "VERIFIED",
          },
        },
      },
      include: {
        domain: {
          select: {
            domain: true,
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
      take: 100,
    });

    console.log(`Processing ${apisToProcess.length} APIs in batches of 10`);

    // Process APIs in batches of 10 in parallel
    for (let i = 0; i < apisToProcess.length; i += 10) {
      const batch = apisToProcess.slice(i, i + 10);

      const processPromises = batch.map(async (apiData) => {
        const { id, path, method, headers, body, domain } = apiData;

        try {
          // Construct full URL by combining domain and path
          const url = `https://${domain.domain}${path}`;

          // Mark API as processing (outside transaction for safety)
          await prisma.api.update({
            where: { id },
            data: { processingStatus: true },
          });

          // Fetch the API (outside transaction to avoid timeout issues)
          const response = await getResponse(url, method, headers, body);
          const isUp = response.statusCode >= 200 && response.statusCode < 300;

          // Store response and update stats in a transaction
          await prisma.$transaction(async (tx) => {
            // Store response in ApiResponse table
            await tx.apiResponse.create({
              data: {
                apiId: id,
                responseTime: response.responseTime,
                statusCode: response.statusCode,
                status: isUp ? "UP" : "DOWN",
              },
            });

            // Update daily stats
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

              await tx.dailyStats.update({
                where: { id: existing.id },
                data: {
                  upCount: newUpCount,
                  avgResponseTime: newAvgResponseTime,
                  totalCount: newTotalCount,
                  upTime: (newUpCount / newTotalCount) * 100,
                },
              });
            }
          });

          // Mark API as done processing
          await prisma.api.update({
            where: { id },
            data: { processingStatus: false },
          });

          console.log(`Successfully processed API: ${url}`);
        } catch (e) {
          console.error(`Error processing API with id ${id}:`, e);
          // Reset processing status on error
          await prisma.api.update({
            where: { id },
            data: { processingStatus: false },
          });
        }
      });

      // Wait for all 10 APIs in the batch to complete
      await Promise.all(processPromises);
    }
  } catch (e) {
    console.error("Error in hitApi:", e);
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
